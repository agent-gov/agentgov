import type { DetectionEvidence } from "../types/index.js";

/**
 * Confidence thresholds
 */
export const CONFIDENCE_THRESHOLDS = {
  /** Minimum confidence to include in report */
  REPORT: 0.4,
  /** Minimum confidence for auto-confirmation */
  AUTO_CONFIRM: 0.8,
  /** Below this, the detection is very uncertain */
  LOW: 0.3,
  /** Medium confidence */
  MEDIUM: 0.6,
  /** High confidence */
  HIGH: 0.8,
} as const;

/**
 * Get a human-readable confidence label
 */
export function getConfidenceLabel(confidence: number): string {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return "High";
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return "Medium";
  if (confidence >= CONFIDENCE_THRESHOLDS.REPORT) return "Low";
  return "Very Low";
}

/**
 * Get a color for the confidence level (for terminal output)
 */
export function getConfidenceColor(confidence: number): "green" | "yellow" | "red" | "dim" {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return "green";
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return "yellow";
  if (confidence >= CONFIDENCE_THRESHOLDS.REPORT) return "red";
  return "dim";
}

/**
 * Summarize evidence into a brief explanation
 */
export function summarizeEvidence(evidence: DetectionEvidence[]): string {
  const types = new Set(evidence.map((e) => e.type));
  const parts: string[] = [];

  if (types.has("import")) parts.push("import detected");
  if (types.has("instantiation")) parts.push("agent instantiation found");
  if (types.has("config_file")) parts.push("config file present");
  if (types.has("dependency")) parts.push("framework in dependencies");
  if (types.has("env_var")) parts.push("API key in environment");
  if (types.has("code_pattern")) parts.push("agent code pattern matched");

  return parts.join(", ");
}
