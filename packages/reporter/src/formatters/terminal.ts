import pc from "picocolors";
import Table from "cli-table3";
import type { ScanResult } from "@agentgov/scanner";
import { getConfidenceLabel } from "@agentgov/scanner";

/**
 * Format scan results for terminal output with colors and tables
 */
export function formatTerminal(result: ScanResult): string {
  const lines: string[] = [];

  // Header
  lines.push("");
  lines.push(pc.bold(pc.cyan("  AgentGov Audit Report")));
  lines.push(pc.dim(`  Scanned: ${result.summary.scanPath}`));
  lines.push(
    pc.dim(
      `  Duration: ${(result.summary.scanDuration / 1000).toFixed(1)}s | Files: ${result.summary.totalFiles} | ${new Date(result.summary.timestamp).toLocaleString()}`,
    ),
  );
  lines.push("");

  if (result.agents.length === 0) {
    lines.push(pc.yellow("  No AI agents detected in this codebase."));
    lines.push("");
    lines.push(pc.dim("  This could mean:"));
    lines.push(pc.dim("    - No agent frameworks are used here"));
    lines.push(pc.dim("    - Agents use a framework we don't detect yet"));
    lines.push(pc.dim("    - Agent code is in a different directory"));
    lines.push("");
    lines.push(pc.dim("  Report missing detections: https://github.com/agent-gov/agentgov/issues"));
    lines.push("");
    return lines.join("\n");
  }

  // Summary banner
  const agentCount = result.agents.length;
  const summaryColor = agentCount > 20 ? pc.red : agentCount > 5 ? pc.yellow : pc.green;
  lines.push(summaryColor(pc.bold(`  Found ${agentCount} agent${agentCount === 1 ? "" : "s"}`)));
  lines.push("");

  // Framework breakdown
  lines.push(pc.bold("  FRAMEWORK BREAKDOWN"));
  lines.push("");

  const maxCount = Math.max(...Object.values(result.frameworkBreakdown));
  const maxBarWidth = 30;

  const sortedFrameworks = Object.entries(result.frameworkBreakdown).sort(([, a], [, b]) => b - a);

  for (const [framework, count] of sortedFrameworks) {
    const barWidth = Math.max(1, Math.round((count / maxCount) * maxBarWidth));
    const bar = "█".repeat(barWidth);
    const percentage = ((count / agentCount) * 100).toFixed(0);
    const displayName = getFrameworkDisplayName(framework);
    lines.push(`    ${pc.bold(displayName.padEnd(20))} ${pc.cyan(bar)} ${count} (${percentage}%)`);
  }
  lines.push("");

  // Risk summary
  const risks = result.risks;
  if (risks.details.length > 0) {
    lines.push(pc.bold("  RISK FLAGS"));
    lines.push("");
    for (const risk of risks.details) {
      const icon =
        risk.severity === "critical"
          ? pc.red("  ✗")
          : risk.severity === "high"
            ? pc.red("  !")
            : risk.severity === "medium"
              ? pc.yellow("  ▲")
              : pc.dim("  ○");
      lines.push(`  ${icon} ${risk.description}`);
    }
    lines.push("");
  }

  // Agent table
  lines.push(pc.bold("  AGENTS DISCOVERED"));
  lines.push("");

  const table = new Table({
    head: [
      pc.bold("#"),
      pc.bold("Agent"),
      pc.bold("Framework"),
      pc.bold("Confidence"),
      pc.bold("Location"),
    ],
    colWidths: [5, 30, 18, 12, 40],
    style: {
      head: [],
      border: [],
      "padding-left": 1,
      "padding-right": 1,
    },
    chars: {
      top: "─",
      "top-mid": "┬",
      "top-left": "  ┌",
      "top-right": "┐",
      bottom: "─",
      "bottom-mid": "┴",
      "bottom-left": "  └",
      "bottom-right": "┘",
      left: "  │",
      "left-mid": "  ├",
      mid: "─",
      "mid-mid": "┼",
      right: "│",
      "right-mid": "┤",
      middle: "│",
    },
  });

  const displayAgents = result.agents.slice(0, 25); // Show top 25
  for (let i = 0; i < displayAgents.length; i++) {
    const agent = displayAgents[i];
    const confidenceStr = formatConfidence(agent.confidence);
    const location = truncatePath(agent.location.filePath, 38);

    table.push([
      pc.dim(`${i + 1}`),
      agent.name,
      getFrameworkDisplayName(agent.framework),
      confidenceStr,
      pc.dim(location),
    ]);
  }

  lines.push(table.toString());

  if (result.agents.length > 25) {
    lines.push(
      pc.dim(
        `  ... and ${result.agents.length - 25} more agents. Use --format json for full list.`,
      ),
    );
  }

  lines.push("");

  // Footer
  lines.push(pc.dim("  ─────────────────────────────────────────────────────"));
  lines.push(`  ${pc.bold(pc.cyan("AgentGov"))} — AI Agent Governance Platform`);
  lines.push(
    `  ${pc.dim("Want governance for these agents?")} ${pc.cyan("https://agent-gov.com")}`,
  );
  lines.push(
    `  ${pc.dim("Report issues:")} ${pc.cyan("https://github.com/agent-gov/agentgov/issues")}`,
  );
  lines.push("");

  return lines.join("\n");
}

function formatConfidence(confidence: number): string {
  const value = `${getConfidenceLabel(confidence)} ${(confidence * 100).toFixed(0)}%`;

  if (confidence >= 0.8) return pc.green(value);
  if (confidence >= 0.6) return pc.yellow(value);
  if (confidence >= 0.4) return pc.red(value);
  return pc.dim(value);
}

function getFrameworkDisplayName(framework: string): string {
  const names: Record<string, string> = {
    langchain: "LangChain",
    langgraph: "LangGraph",
    crewai: "CrewAI",
    autogen: "AutoGen",
    "semantic-kernel": "Semantic Kernel",
    haystack: "Haystack",
    llamaindex: "LlamaIndex",
    "openai-assistants": "OpenAI",
    "anthropic-claude": "Anthropic",
    "aws-bedrock": "AWS Bedrock",
    "google-vertex": "Google Vertex",
    "vercel-ai": "Vercel AI",
    custom: "Custom",
    unknown: "Unknown",
  };
  return names[framework] ?? framework;
}

function truncatePath(path: string, maxLen: number): string {
  if (path.length <= maxLen) return path;
  return "..." + path.slice(path.length - maxLen + 3);
}
