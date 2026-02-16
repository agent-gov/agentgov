import { resolve } from "node:path";
import ora from "ora";
import pc from "picocolors";
import type { Command } from "commander";
import { scan } from "@agentgov/scanner";
import type { ScanProgress, OutputFormat } from "@agentgov/scanner";
import { formatTerminal, formatJson, writeJsonReport, writeHtmlReport } from "@agentgov/reporter";

interface AuditOptions {
  path?: string;
  github?: string;
  token?: string;
  format?: OutputFormat;
  output?: string;
  verbose?: boolean;
  threshold?: string;
}

export function registerAuditCommand(program: Command): void {
  program
    .command("audit")
    .description("Scan a codebase for AI agent frameworks")
    .option("-p, --path <dir>", "Directory to scan (default: current directory)")
    .option("-g, --github <org>", "GitHub organization to scan")
    .option("-t, --token <token>", "GitHub personal access token (or set GITHUB_TOKEN)")
    .option(
      "-f, --format <format>",
      "Output format: terminal, json, html (default: terminal)",
      "terminal",
    )
    .option("-o, --output <file>", "Output file path (for json/html formats)")
    .option("-v, --verbose", "Show detailed scanning progress")
    .option("--threshold <number>", "Minimum confidence threshold (0.0-1.0, default: 0.4)", "0.4")
    .action(async (opts: AuditOptions) => {
      await runAudit(opts);
    });
}

async function runAudit(opts: AuditOptions): Promise<void> {
  const spinner = ora({
    text: "Discovering files...",
    color: "cyan",
  }).start();

  try {
    const scanPath = opts.path ? resolve(opts.path) : process.cwd();
    const format = (opts.format ?? "terminal") as OutputFormat;
    const threshold = parseFloat(opts.threshold ?? "0.4");

    // Progress callback
    const onProgress = (progress: ScanProgress) => {
      switch (progress.phase) {
        case "discovering":
          spinner.text = `Discovering files...`;
          break;
        case "scanning":
          spinner.text = `Scanning ${progress.filesScanned}/${progress.filesDiscovered} files... (${progress.agentsFound} agents found)`;
          break;
        case "analyzing":
          spinner.text = `Analyzing patterns...`;
          break;
        case "enriching":
          spinner.text = `Enriching agent data...`;
          break;
        case "complete":
          break;
      }
    };

    // Run the scan
    const result = await scan(
      {
        path: scanPath,
        github: opts.github
          ? {
              org: opts.github,
              token: opts.token ?? process.env.GITHUB_TOKEN ?? "",
            }
          : undefined,
        format,
        outputPath: opts.output,
        verbose: opts.verbose,
        confidenceThreshold: threshold,
      },
      onProgress,
    );

    spinner.stop();

    // Output results
    switch (format) {
      case "terminal": {
        const output = formatTerminal(result);
        console.log(output);
        break;
      }
      case "json": {
        if (opts.output) {
          await writeJsonReport(result, opts.output);
          console.log(pc.green(`\n  JSON report written to ${opts.output}\n`));
        } else {
          console.log(formatJson(result));
        }
        break;
      }
      case "html": {
        const outputPath = opts.output ?? "agentgov-audit-report.html";
        await writeHtmlReport(result, outputPath);
        console.log(pc.green(`\n  HTML report written to ${outputPath}\n`));
        break;
      }
    }
  } catch (error) {
    spinner.fail("Scan failed");
    if (error instanceof Error) {
      console.error(pc.red(`\n  Error: ${error.message}\n`));
      if (opts.verbose) {
        console.error(error.stack);
      }
    }
    process.exit(1);
  }
}
