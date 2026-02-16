import type { ScanOptions, ScanResult, ProgressCallback } from "./types/index.js";
import { scanLocal } from "./scanners/local.js";

/**
 * Main scan orchestrator.
 * Routes to the appropriate scanner based on options.
 */
export async function scan(
  options: ScanOptions,
  onProgress?: ProgressCallback,
): Promise<ScanResult> {
  // Determine scan type
  if (options.github) {
    // GitHub scanning (Sprint 1 Day 6 - stretch goal)
    throw new Error(
      "GitHub scanning is not yet implemented. Use local scanning: agentgov audit --path /your/code",
    );
  }

  // Default: local directory scan
  return scanLocal(options, onProgress);
}
