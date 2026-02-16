import { readFile } from "node:fs/promises";
import { extname, basename } from "node:path";
import type {
  AgentFramework,
  DetectionEvidence,
  Language,
  PatternDefinition,
  FrameworkPatterns,
} from "../types/index.js";
import { getPatternsForLanguage, LANGUAGE_EXTENSIONS } from "../patterns/index.js";

/**
 * Result of analyzing a single file
 */
export interface FileAnalysisResult {
  filePath: string;
  language: Language;
  detections: FileDetection[];
}

export interface FileDetection {
  framework: AgentFramework;
  displayName: string;
  evidence: DetectionEvidence[];
  totalConfidence: number;
}

/**
 * Detect the language of a file based on its extension
 */
export function detectLanguage(filePath: string): Language {
  const ext = extname(filePath).toLowerCase();
  return LANGUAGE_EXTENSIONS[ext] ?? "unknown";
}

/**
 * Analyze a single file for agent framework patterns
 */
export async function analyzeFile(filePath: string): Promise<FileAnalysisResult> {
  const language = detectLanguage(filePath);
  const result: FileAnalysisResult = {
    filePath,
    language,
    detections: [],
  };

  // Skip unknown language files (they can still be checked for config patterns)
  if (language === "unknown") {
    return result;
  }

  let content: string;
  try {
    content = await readFile(filePath, "utf-8");
  } catch {
    return result;
  }

  // Get patterns for this language
  const patterns = getPatternsForLanguage(language);

  // Also get patterns that apply to the other variant of JS/TS
  const additionalLanguage: Language | null =
    language === "typescript" ? "javascript" : language === "javascript" ? "typescript" : null;

  const allPatterns = additionalLanguage
    ? [...patterns, ...getPatternsForLanguage(additionalLanguage)]
    : patterns;

  // Deduplicate by framework
  const uniquePatterns = deduplicatePatterns(allPatterns);

  // Check each framework's patterns against the file content
  for (const frameworkPatterns of uniquePatterns) {
    const evidence = matchPatterns(content, filePath, frameworkPatterns);
    if (evidence.length > 0) {
      const totalConfidence = calculateConfidence(evidence);
      result.detections.push({
        framework: frameworkPatterns.framework,
        displayName: frameworkPatterns.displayName,
        evidence,
        totalConfidence,
      });
    }
  }

  return result;
}

/**
 * Analyze file content that's already been read (e.g., from GitHub API)
 */
export function analyzeContent(
  content: string,
  filePath: string,
  language: Language,
): FileAnalysisResult {
  const result: FileAnalysisResult = {
    filePath,
    language,
    detections: [],
  };

  if (language === "unknown") return result;

  const patterns = getPatternsForLanguage(language);
  const additionalLanguage: Language | null =
    language === "typescript" ? "javascript" : language === "javascript" ? "typescript" : null;

  const allPatterns = additionalLanguage
    ? [...patterns, ...getPatternsForLanguage(additionalLanguage)]
    : patterns;

  const uniquePatterns = deduplicatePatterns(allPatterns);

  for (const frameworkPatterns of uniquePatterns) {
    const evidence = matchPatterns(content, filePath, frameworkPatterns);
    if (evidence.length > 0) {
      const totalConfidence = calculateConfidence(evidence);
      result.detections.push({
        framework: frameworkPatterns.framework,
        displayName: frameworkPatterns.displayName,
        evidence,
        totalConfidence,
      });
    }
  }

  return result;
}

/**
 * Match all patterns for a framework against file content
 */
function matchPatterns(
  content: string,
  filePath: string,
  frameworkPatterns: FrameworkPatterns,
): DetectionEvidence[] {
  const evidence: DetectionEvidence[] = [];
  const lines = content.split("\n");

  const allPatternDefs: PatternDefinition[] = [
    ...frameworkPatterns.imports,
    ...frameworkPatterns.instantiations,
  ];

  for (const patternDef of allPatternDefs) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = patternDef.pattern.exec(line);
      if (match) {
        evidence.push({
          type: patternDef.type,
          pattern: patternDef.pattern.source,
          matchedText: truncate(match[0], 200),
          filePath,
          line: i + 1,
          confidenceContribution: patternDef.confidence,
        });
        // Only count each pattern once per file
        break;
      }
    }
  }

  return evidence;
}

/**
 * Calculate total confidence from evidence
 * Uses additive scoring with diminishing returns
 */
function calculateConfidence(evidence: DetectionEvidence[]): number {
  if (evidence.length === 0) return 0;

  let total = 0;
  const typesSeen = new Set<string>();

  for (const e of evidence) {
    total += e.confidenceContribution;
    typesSeen.add(e.type);
  }

  // Bonus for multiple signal types (corroborating evidence)
  if (typesSeen.size >= 2) {
    total += 0.1;
  }

  // Cap at 1.0
  return Math.min(1.0, Math.round(total * 100) / 100);
}

/**
 * Deduplicate pattern sets by framework
 */
function deduplicatePatterns(patterns: FrameworkPatterns[]): FrameworkPatterns[] {
  const seen = new Map<string, FrameworkPatterns>();
  for (const p of patterns) {
    if (!seen.has(p.framework)) {
      seen.set(p.framework, p);
    } else {
      // Merge patterns from the same framework
      const existing = seen.get(p.framework)!;
      seen.set(p.framework, {
        ...existing,
        imports: [...existing.imports, ...p.imports],
        instantiations: [...existing.instantiations, ...p.instantiations],
        configFiles: [...(existing.configFiles ?? []), ...(p.configFiles ?? [])],
        dependencies: [...(existing.dependencies ?? []), ...(p.dependencies ?? [])],
      });
    }
  }
  return Array.from(seen.values());
}

/**
 * Extract a meaningful agent name from detection evidence
 */
export function extractAgentName(filePath: string, content?: string): string {
  const filename = basename(filePath);
  const nameWithoutExt = filename.replace(/\.[^.]+$/, "");

  // Try to extract class name from content
  if (content) {
    const classMatch = content.match(/class\s+(\w*[Aa]gent\w*)/);
    if (classMatch) return classMatch[1];

    const crewMatch = content.match(/class\s+(\w*[Cc]rew\w*)/);
    if (crewMatch) return crewMatch[1];
  }

  // Fall back to file name, cleaned up
  return (
    nameWithoutExt
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim() || "Unknown Agent"
  );
}

function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen) + "..." : str;
}
