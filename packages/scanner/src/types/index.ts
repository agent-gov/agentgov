/**
 * Core type definitions for AgentGov Scanner
 *
 * These types define the data structures used throughout the scanner,
 * reporter, and CLI packages. They are designed to be compatible with
 * the AgentRecord schema from the AgentRegistry MVP spec.
 */

// ─── Agent Detection Types ───────────────────────────────────────────────────

export type AgentFramework =
  | "langchain"
  | "langgraph"
  | "crewai"
  | "autogen"
  | "semantic-kernel"
  | "haystack"
  | "llamaindex"
  | "openai-assistants"
  | "anthropic-claude"
  | "aws-bedrock"
  | "google-vertex"
  | "vercel-ai"
  | "custom"
  | "unknown";

export type Language = "python" | "typescript" | "javascript" | "unknown";

export type RiskSeverity = "low" | "medium" | "high" | "critical";

export interface AgentLocation {
  /** Relative file path from scan root */
  filePath: string;
  /** Line number where agent was detected */
  line?: number;
  /** Column number */
  column?: number;
  /** GitHub repository (for GitHub scans) */
  repository?: string;
}

export interface AgentCapabilities {
  /** Tools/functions the agent can invoke */
  tools?: string[];
  /** Whether the agent has memory/state */
  hasMemory?: boolean;
  /** Whether the agent accesses databases */
  hasDatabase?: boolean;
  /** Whether the agent can send emails */
  canSendEmail?: boolean;
  /** External APIs the agent calls */
  externalAPIs?: string[];
  /** Whether the agent can spawn sub-agents */
  canSpawnAgents?: boolean;
}

export interface RiskFlag {
  severity: RiskSeverity;
  type: string;
  description: string;
}

export interface AgentRecord {
  /** Unique identifier for this detection */
  id: string;
  /** Human-readable name (derived from class/file/config) */
  name: string;
  /** Detected framework */
  framework: AgentFramework;
  /** Detection confidence (0.0 - 1.0) */
  confidence: number;
  /** Where the agent was found */
  location: AgentLocation;
  /** Agent metadata */
  metadata: {
    /** Programming language */
    language: Language;
    /** Entry point file */
    entryPoint?: string;
    /** Detected dependencies */
    dependencies?: string[];
    /** Associated config files */
    configFiles?: string[];
    /** Agent owner (from git blame) */
    owner?: string;
    /** Last modification date */
    lastModified?: Date;
    /** LLM model provider */
    modelProvider?: string;
    /** Specific model ID */
    modelId?: string;
  };
  /** Detected capabilities */
  capabilities?: AgentCapabilities;
  /** Risk flags */
  risks?: RiskFlag[];
  /** Raw evidence that led to this detection */
  evidence: DetectionEvidence[];
}

// ─── Detection Pattern Types ─────────────────────────────────────────────────

export interface DetectionEvidence {
  /** Type of evidence */
  type: "import" | "instantiation" | "config_file" | "dependency" | "env_var" | "code_pattern";
  /** The pattern that matched */
  pattern: string;
  /** The matched text (truncated, max 200 chars) */
  matchedText: string;
  /** File where the match was found */
  filePath: string;
  /** Line number */
  line?: number;
  /** Confidence contribution from this evidence */
  confidenceContribution: number;
}

export interface PatternDefinition {
  /** Regex pattern to match */
  pattern: RegExp;
  /** Type of evidence this pattern produces */
  type: DetectionEvidence["type"];
  /** Confidence contribution when matched */
  confidence: number;
  /** Human-readable description */
  description: string;
}

export interface FrameworkPatterns {
  /** Framework identifier */
  framework: AgentFramework;
  /** Display name */
  displayName: string;
  /** Languages this framework supports */
  languages: Language[];
  /** Import patterns */
  imports: PatternDefinition[];
  /** Instantiation/usage patterns */
  instantiations: PatternDefinition[];
  /** Config file names to look for */
  configFiles?: string[];
  /** Dependency names (in package.json / requirements.txt / pyproject.toml) */
  dependencies?: string[];
}

// ─── Scan Types ──────────────────────────────────────────────────────────────

export type ScanType = "local" | "github" | "cloud";
export type OutputFormat = "terminal" | "json" | "html";

export interface ScanOptions {
  /** Local directory path to scan */
  path?: string;
  /** GitHub scan options */
  github?: {
    org: string;
    token: string;
    repos?: string[];
  };
  /** Output format */
  format?: OutputFormat;
  /** Output file path (for json/html) */
  outputPath?: string;
  /** Verbose logging */
  verbose?: boolean;
  /** Additional exclusion patterns */
  excludePatterns?: string[];
  /** Minimum confidence to include in results (default: 0.4) */
  confidenceThreshold?: number;
  /** Maximum files to scan (default: 10000) */
  maxFiles?: number;
}

export interface ScanProgress {
  /** Current phase */
  phase: "discovering" | "scanning" | "analyzing" | "enriching" | "complete";
  /** Files discovered so far */
  filesDiscovered: number;
  /** Files scanned so far */
  filesScanned: number;
  /** Agents found so far */
  agentsFound: number;
  /** Current file being scanned */
  currentFile?: string;
  /** Current repo being scanned (GitHub) */
  currentRepo?: string;
}

export interface ScanResult {
  /** Summary statistics */
  summary: {
    totalAgents: number;
    totalFiles: number;
    totalRepositories: number;
    scanDuration: number;
    timestamp: Date;
    scanType: ScanType;
    scanPath: string;
  };
  /** Discovered agents */
  agents: AgentRecord[];
  /** Framework breakdown */
  frameworkBreakdown: Record<string, number>;
  /** Risk summary */
  risks: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    details: RiskFlag[];
  };
  /** Scan metadata */
  metadata: {
    scanType: ScanType;
    paths: string[];
    excludedPaths: string[];
    confidenceThreshold: number;
    version: string;
  };
}

// ─── Scanner Interface ───────────────────────────────────────────────────────

export type ProgressCallback = (progress: ScanProgress) => void;

export interface Scanner {
  scan(options: ScanOptions, onProgress?: ProgressCallback): Promise<ScanResult>;
}
