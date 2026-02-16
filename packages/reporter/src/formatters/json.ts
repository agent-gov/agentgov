import { writeFile } from "node:fs/promises";
import type { ScanResult } from "@agentgov/scanner";

/**
 * Format scan results as JSON
 */
export function formatJson(result: ScanResult): string {
  return JSON.stringify(result, null, 2);
}

/**
 * Write scan results to a JSON file
 */
export async function writeJsonReport(result: ScanResult, outputPath: string): Promise<void> {
  const json = formatJson(result);
  await writeFile(outputPath, json, "utf-8");
}
