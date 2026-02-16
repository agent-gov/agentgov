import { readFile, stat } from "node:fs/promises";
import { resolve, basename, join, extname } from "node:path";
import fg from "fast-glob";
import ignore from "ignore";
import { randomUUID } from "node:crypto";
import type {
  ScanOptions,
  ScanResult,
  AgentRecord,
  ProgressCallback,
  ScanProgress,
  DetectionEvidence,
} from "../types/index.js";
import { analyzeFile, extractAgentName } from "../analyzers/file-analyzer.js";
import { CONFIDENCE_THRESHOLDS } from "../analyzers/confidence.js";
import { enrichWithGitBlame } from "../enrichers/git-blame.js";
import { enrichWithRisks } from "../enrichers/risk.js";
import {
  LANGUAGE_EXTENSIONS,
  SKIP_DIRECTORIES,
  MAX_FILE_SIZE,
  DEPENDENCY_FILES,
  DEPENDENCY_MAPPINGS,
  ENV_VAR_PATTERNS,
  getAgentConfigFileNames,
} from "../patterns/index.js";

const VERSION = "0.1.0";

/**
 * Scan a local directory for AI agent frameworks
 */
export async function scanLocal(
  options: ScanOptions,
  onProgress?: ProgressCallback,
): Promise<ScanResult> {
  const scanPath = resolve(options.path ?? process.cwd());
  const startTime = Date.now();
  const confidenceThreshold = options.confidenceThreshold ?? CONFIDENCE_THRESHOLDS.REPORT;
  const maxFiles = options.maxFiles ?? 10_000;

  const progress: ScanProgress = {
    phase: "discovering",
    filesDiscovered: 0,
    filesScanned: 0,
    agentsFound: 0,
  };

  onProgress?.(progress);

  // Load .gitignore patterns
  const ig = ignore();
  try {
    const gitignoreContent = await readFile(join(scanPath, ".gitignore"), "utf-8");
    ig.add(gitignoreContent);
  } catch {
    // No .gitignore, that's fine
  }

  // Add default skip patterns
  ig.add(SKIP_DIRECTORIES);

  // Add user-specified exclusions
  if (options.excludePatterns) {
    ig.add(options.excludePatterns);
  }

  // Discover files
  const sourceExtensions = Object.keys(LANGUAGE_EXTENSIONS);
  const configFileNames = getAgentConfigFileNames();
  const depFileNames = DEPENDENCY_FILES;

  // Glob for source files + config files + dependency files + .env files
  const globPatterns = [
    ...sourceExtensions.map((ext) => `**/*${ext}`),
    ...configFileNames.map((name) => `**/${name}`),
    ...depFileNames.map((name) => `**/${name}`),
    "**/.env",
    "**/.env.*",
    "**/Dockerfile",
    "**/Dockerfile.*",
  ];

  const allFiles = await fg(globPatterns, {
    cwd: scanPath,
    absolute: false,
    dot: true,
    onlyFiles: true,
    suppressErrors: true,
    ignore: SKIP_DIRECTORIES.map((d) => `**/${d}/**`),
  });

  // Filter through .gitignore
  const files = allFiles.filter((f) => !ig.ignores(f)).slice(0, maxFiles);

  progress.phase = "scanning";
  progress.filesDiscovered = files.length;
  onProgress?.(progress);

  // Analyze files
  const agentMap = new Map<string, AgentRecord>();
  const dependencyEvidence: DetectionEvidence[] = [];
  const envEvidence: DetectionEvidence[] = [];

  for (const file of files) {
    const fullPath = join(scanPath, file);
    progress.currentFile = file;
    onProgress?.(progress);

    // Check file size
    try {
      const fileStat = await stat(fullPath);
      if (fileStat.size > MAX_FILE_SIZE) continue;
    } catch {
      continue;
    }

    const ext = extname(file).toLowerCase();
    const name = basename(file);

    // Check if it's a source file
    if (ext in LANGUAGE_EXTENSIONS) {
      const result = await analyzeFile(fullPath);
      for (const detection of result.detections) {
        if (detection.totalConfidence >= confidenceThreshold) {
          const agentKey = `${detection.framework}:${file}`;
          if (!agentMap.has(agentKey)) {
            let content: string | undefined;
            try {
              content = await readFile(fullPath, "utf-8");
            } catch {
              // Ignore read errors
            }

            agentMap.set(agentKey, {
              id: `ag_${randomUUID()}`,
              name: extractAgentName(file, content),
              framework: detection.framework,
              confidence: detection.totalConfidence,
              location: { filePath: file },
              metadata: {
                language: result.language,
                entryPoint: file,
              },
              evidence: detection.evidence,
            });
            progress.agentsFound = agentMap.size;
            onProgress?.(progress);
          }
        }
      }
    }

    // Check dependency files
    if (depFileNames.includes(name)) {
      try {
        const content = await readFile(fullPath, "utf-8");
        const depResults = analyzeDependencyFile(content, file, name);
        dependencyEvidence.push(...depResults);
      } catch {
        // Ignore
      }
    }

    // Check .env files
    if (name === ".env" || name.startsWith(".env.")) {
      try {
        const content = await readFile(fullPath, "utf-8");
        const envResults = analyzeEnvFile(content, file);
        envEvidence.push(...envResults);
      } catch {
        // Ignore
      }
    }

    // Check agent config files
    if (configFileNames.includes(name)) {
      // A config file by itself is evidence of an agent
      const configEvidence: DetectionEvidence = {
        type: "config_file",
        pattern: name,
        matchedText: name,
        filePath: file,
        confidenceContribution: 0.1,
      };

      // Try to attribute to a framework
      if (name === "crewai.yaml" || name === "crewai.yml") {
        const agentKey = `crewai:${file}`;
        if (!agentMap.has(agentKey)) {
          agentMap.set(agentKey, {
            id: `ag_${randomUUID()}`,
            name: "CrewAI Agent",
            framework: "crewai",
            confidence: 0.7,
            location: { filePath: file },
            metadata: { language: "python" },
            evidence: [{ ...configEvidence, confidenceContribution: 0.7 }],
          });
          progress.agentsFound = agentMap.size;
          onProgress?.(progress);
        }
      }
    }

    progress.filesScanned++;
    onProgress?.(progress);
  }

  // Enrich agents with dependency and env evidence
  enrichWithDependencies(agentMap, dependencyEvidence);
  enrichWithEnvVars(agentMap, envEvidence);

  // Phase: enriching (git blame + risk detection)
  progress.phase = "enriching";
  onProgress?.(progress);

  const agents = Array.from(agentMap.values()).sort((a, b) => b.confidence - a.confidence);

  // Enrich with git blame (ownership + last modified)
  // This is async and gracefully degrades if not in a git repo
  await enrichWithGitBlame(agents, scanPath);

  // Evaluate risk flags for each agent and compute scan-level summary
  const risks = enrichWithRisks(agents);

  // Build the result
  progress.phase = "complete";
  onProgress?.(progress);

  const frameworkBreakdown: Record<string, number> = {};
  for (const agent of agents) {
    frameworkBreakdown[agent.framework] = (frameworkBreakdown[agent.framework] ?? 0) + 1;
  }

  return {
    summary: {
      totalAgents: agents.length,
      totalFiles: files.length,
      totalRepositories: 1,
      scanDuration: Date.now() - startTime,
      timestamp: new Date(),
      scanType: "local",
      scanPath,
    },
    agents,
    frameworkBreakdown,
    risks,
    metadata: {
      scanType: "local",
      paths: [scanPath],
      excludedPaths: SKIP_DIRECTORIES,
      confidenceThreshold,
      version: VERSION,
    },
  };
}

/**
 * Analyze a dependency file for agent framework dependencies
 */
function analyzeDependencyFile(
  content: string,
  filePath: string,
  fileName: string,
): DetectionEvidence[] {
  const evidence: DetectionEvidence[] = [];

  if (fileName === "requirements.txt" || fileName === "Pipfile") {
    // Line-based dependency file
    for (const line of content.split("\n")) {
      const cleanLine = line
        .trim()
        .toLowerCase()
        .split(/[>=<![#;]/)[0]
        .trim();
      const match = DEPENDENCY_MAPPINGS.find(
        (d) => d.name === cleanLine && (d.language === "python" || d.language === "any"),
      );
      if (match) {
        evidence.push({
          type: "dependency",
          pattern: match.name,
          matchedText: line.trim().slice(0, 200),
          filePath,
          confidenceContribution: match.confidence,
        });
      }
    }
  } else if (fileName === "pyproject.toml") {
    // Check for dependencies in pyproject.toml
    for (const dep of DEPENDENCY_MAPPINGS) {
      if (dep.language !== "python" && dep.language !== "any") continue;
      if (
        content.includes(`"${dep.name}"`) ||
        content.includes(`'${dep.name}'`) ||
        content.includes(dep.name)
      ) {
        evidence.push({
          type: "dependency",
          pattern: dep.name,
          matchedText: dep.name,
          filePath,
          confidenceContribution: dep.confidence,
        });
      }
    }
  } else if (fileName === "package.json") {
    // Parse package.json
    try {
      const pkg = JSON.parse(content);
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };
      for (const depName of Object.keys(allDeps)) {
        const match = DEPENDENCY_MAPPINGS.find(
          (d) =>
            d.name === depName &&
            (d.language === "typescript" || d.language === "javascript" || d.language === "any"),
        );
        if (match) {
          evidence.push({
            type: "dependency",
            pattern: match.name,
            matchedText: `${depName}: ${allDeps[depName]}`,
            filePath,
            confidenceContribution: match.confidence,
          });
        }
      }
    } catch {
      // Invalid JSON, skip
    }
  }

  return evidence;
}

/**
 * Analyze .env files for AI-related API keys
 */
function analyzeEnvFile(content: string, filePath: string): DetectionEvidence[] {
  const evidence: DetectionEvidence[] = [];

  for (const envPattern of ENV_VAR_PATTERNS) {
    if (envPattern.pattern.test(content)) {
      evidence.push({
        type: "env_var",
        pattern: envPattern.pattern.source,
        // NEVER include the actual API key value
        matchedText: `${envPattern.provider} API key detected (value redacted)`,
        filePath,
        confidenceContribution: envPattern.confidence,
      });
    }
  }

  return evidence;
}

/**
 * Enrich agent records with dependency evidence
 */
function enrichWithDependencies(
  agentMap: Map<string, AgentRecord>,
  depEvidence: DetectionEvidence[],
): void {
  // Group dependency evidence by framework
  for (const dep of depEvidence) {
    const mapping = DEPENDENCY_MAPPINGS.find((d) => d.name === dep.pattern);
    if (!mapping) continue;

    // Find existing agents of this framework and add evidence
    for (const agent of agentMap.values()) {
      if (agent.framework === mapping.framework) {
        const alreadyHas = agent.evidence.some(
          (e) => e.type === "dependency" && e.pattern === dep.pattern,
        );
        if (!alreadyHas) {
          agent.evidence.push(dep);
          agent.confidence = Math.min(1.0, agent.confidence + dep.confidenceContribution * 0.5);
        }
      }
    }
  }
}

/**
 * Enrich agent records with environment variable evidence
 */
function enrichWithEnvVars(
  agentMap: Map<string, AgentRecord>,
  envEvidence: DetectionEvidence[],
): void {
  for (const env of envEvidence) {
    // Add env evidence to all agents (any agent could use these keys)
    for (const agent of agentMap.values()) {
      const alreadyHas = agent.evidence.some(
        (e) => e.type === "env_var" && e.pattern === env.pattern,
      );
      if (!alreadyHas) {
        agent.evidence.push(env);
        // Small confidence boost for env vars
        agent.confidence = Math.min(1.0, agent.confidence + 0.05);
      }
    }
  }
}
