/**
 * @agentgov/scanner — AI agent discovery and scanning engine
 *
 * Scans codebases for AI agent frameworks including LangChain, CrewAI,
 * AutoGen, Semantic Kernel, Haystack, LlamaIndex, OpenAI Assistants,
 * Anthropic Claude, AWS Bedrock, Google Vertex AI, and Vercel AI SDK.
 */

// Main entry point
export { scan } from "./orchestrator.js";

// Scanners
export { scanLocal } from "./scanners/local.js";

// Analyzers
export { analyzeFile, analyzeContent, extractAgentName } from "./analyzers/file-analyzer.js";
export {
  CONFIDENCE_THRESHOLDS,
  getConfidenceLabel,
  getConfidenceColor,
  summarizeEvidence,
} from "./analyzers/confidence.js";

// Enrichers
export { enrichWithGitBlame, isGitRepo, getFileBlame } from "./enrichers/git-blame.js";
export type { GitBlameResult } from "./enrichers/git-blame.js";
export { evaluateAgentRisks, enrichWithRisks } from "./enrichers/risk.js";

// Patterns
export { ALL_PATTERNS, getPatternsForLanguage, LANGUAGE_EXTENSIONS } from "./patterns/index.js";

// Types
export type {
  AgentRecord,
  AgentFramework,
  AgentLocation,
  AgentCapabilities,
  Language,
  RiskFlag,
  RiskSeverity,
  DetectionEvidence,
  PatternDefinition,
  FrameworkPatterns,
  ScanOptions,
  ScanResult,
  ScanProgress,
  ScanType,
  OutputFormat,
  ProgressCallback,
  Scanner,
} from "./types/index.js";
