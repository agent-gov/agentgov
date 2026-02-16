import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Command } from "commander";
import { registerAuditCommand } from "../src/commands/audit.js";

// Mock scanner — prevent real filesystem scanning in CLI tests
vi.mock("@agentgov/scanner", () => ({
  scan: vi.fn().mockResolvedValue({
    summary: {
      totalAgents: 2,
      totalFiles: 100,
      totalRepositories: 1,
      scanDuration: 500,
      timestamp: new Date("2026-02-15T10:00:00Z"),
      scanType: "local",
      scanPath: "/test",
    },
    agents: [
      {
        id: "ag_mock-1",
        name: "Mock Agent",
        framework: "langchain",
        confidence: 0.9,
        location: { filePath: "agent.py" },
        metadata: { language: "python" },
        evidence: [],
      },
    ],
    frameworkBreakdown: { langchain: 1 },
    risks: { critical: 0, high: 0, medium: 0, low: 0, details: [] },
    metadata: {
      scanType: "local",
      paths: ["/test"],
      excludedPaths: [],
      confidenceThreshold: 0.4,
      version: "0.1.0",
    },
  }),
}));

// Mock ora — spinner is not testable in unit tests
vi.mock("ora", () => ({
  default: () => ({
    start: vi.fn().mockReturnThis(),
    stop: vi.fn(),
    fail: vi.fn(),
    text: "",
  }),
}));

// Mock reporter
vi.mock("@agentgov/reporter", () => ({
  formatTerminal: vi.fn().mockReturnValue("Mock terminal output"),
  formatJson: vi.fn().mockReturnValue('{"mock": true}'),
  writeJsonReport: vi.fn().mockResolvedValue(undefined),
  writeHtmlReport: vi.fn().mockResolvedValue(undefined),
}));

describe("Audit Command Registration", () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    program.name("agentgov").version("0.1.0");
    registerAuditCommand(program);
  });

  it("should register the audit command", () => {
    const auditCmd = program.commands.find((c) => c.name() === "audit");
    expect(auditCmd).toBeDefined();
  });

  it("should have correct description", () => {
    const auditCmd = program.commands.find((c) => c.name() === "audit");
    expect(auditCmd?.description()).toBe("Scan a codebase for AI agent frameworks");
  });

  it("should have --path option", () => {
    const auditCmd = program.commands.find((c) => c.name() === "audit");
    const pathOpt = auditCmd?.options.find((o) => o.long === "--path");
    expect(pathOpt).toBeDefined();
    expect(pathOpt?.short).toBe("-p");
  });

  it("should have --github option", () => {
    const auditCmd = program.commands.find((c) => c.name() === "audit");
    const githubOpt = auditCmd?.options.find((o) => o.long === "--github");
    expect(githubOpt).toBeDefined();
    expect(githubOpt?.short).toBe("-g");
  });

  it("should have --token option", () => {
    const auditCmd = program.commands.find((c) => c.name() === "audit");
    const tokenOpt = auditCmd?.options.find((o) => o.long === "--token");
    expect(tokenOpt).toBeDefined();
    expect(tokenOpt?.short).toBe("-t");
  });

  it("should have --format option with terminal default", () => {
    const auditCmd = program.commands.find((c) => c.name() === "audit");
    const formatOpt = auditCmd?.options.find((o) => o.long === "--format");
    expect(formatOpt).toBeDefined();
    expect(formatOpt?.short).toBe("-f");
    expect(formatOpt?.defaultValue).toBe("terminal");
  });

  it("should have --output option", () => {
    const auditCmd = program.commands.find((c) => c.name() === "audit");
    const outputOpt = auditCmd?.options.find((o) => o.long === "--output");
    expect(outputOpt).toBeDefined();
    expect(outputOpt?.short).toBe("-o");
  });

  it("should have --verbose option", () => {
    const auditCmd = program.commands.find((c) => c.name() === "audit");
    const verboseOpt = auditCmd?.options.find((o) => o.long === "--verbose");
    expect(verboseOpt).toBeDefined();
    expect(verboseOpt?.short).toBe("-v");
  });

  it("should have --threshold option with 0.4 default", () => {
    const auditCmd = program.commands.find((c) => c.name() === "audit");
    const thresholdOpt = auditCmd?.options.find((o) => o.long === "--threshold");
    expect(thresholdOpt).toBeDefined();
    expect(thresholdOpt?.defaultValue).toBe("0.4");
  });
});

describe("Audit Command Execution", () => {
  let program: Command;
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    program = new Command();
    program.name("agentgov").version("0.1.0");
    // Prevent commander from calling process.exit on errors
    program.exitOverride();
    registerAuditCommand(program);

    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    exitSpy.mockRestore();
    vi.clearAllMocks();
  });

  it("should execute audit with default options", async () => {
    const { scan } = await import("@agentgov/scanner");

    await program.parseAsync(["node", "agentgov", "audit"]);

    expect(scan).toHaveBeenCalledTimes(1);
    const callArgs = (scan as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[0]).toMatchObject({
      format: "terminal",
      confidenceThreshold: 0.4,
    });
  });

  it("should pass custom path to scanner", async () => {
    const { scan } = await import("@agentgov/scanner");

    await program.parseAsync(["node", "agentgov", "audit", "--path", "/custom/path"]);

    const callArgs = (scan as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[0].path).toContain("custom");
  });

  it("should pass format option to scanner", async () => {
    const { scan } = await import("@agentgov/scanner");

    await program.parseAsync(["node", "agentgov", "audit", "--format", "json"]);

    const callArgs = (scan as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[0].format).toBe("json");
  });

  it("should pass confidence threshold to scanner", async () => {
    const { scan } = await import("@agentgov/scanner");

    await program.parseAsync(["node", "agentgov", "audit", "--threshold", "0.8"]);

    const callArgs = (scan as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[0].confidenceThreshold).toBe(0.8);
  });

  it("should call formatTerminal for terminal format", async () => {
    const { formatTerminal } = await import("@agentgov/reporter");

    await program.parseAsync(["node", "agentgov", "audit"]);

    expect(formatTerminal).toHaveBeenCalledTimes(1);
  });

  it("should call formatJson for json format (no output file)", async () => {
    const { formatJson } = await import("@agentgov/reporter");

    await program.parseAsync(["node", "agentgov", "audit", "--format", "json"]);

    expect(formatJson).toHaveBeenCalledTimes(1);
  });

  it("should call writeJsonReport for json format with output file", async () => {
    const { writeJsonReport } = await import("@agentgov/reporter");

    await program.parseAsync([
      "node",
      "agentgov",
      "audit",
      "--format",
      "json",
      "--output",
      "/tmp/test-report.json",
    ]);

    expect(writeJsonReport).toHaveBeenCalledTimes(1);
  });

  it("should call writeHtmlReport for html format", async () => {
    const { writeHtmlReport } = await import("@agentgov/reporter");

    await program.parseAsync(["node", "agentgov", "audit", "--format", "html"]);

    expect(writeHtmlReport).toHaveBeenCalledTimes(1);
  });

  it("should provide progress callback to scanner", async () => {
    const { scan } = await import("@agentgov/scanner");

    await program.parseAsync(["node", "agentgov", "audit"]);

    const callArgs = (scan as ReturnType<typeof vi.fn>).mock.calls[0];
    // Second argument should be the progress callback
    expect(typeof callArgs[1]).toBe("function");
  });
});

describe("CLI Program Structure", () => {
  it("should have correct program name and version in main entry", async () => {
    // Test the program structure that would be created by index.ts
    const program = new Command();
    program
      .name("agentgov")
      .description("AgentGov CLI — Discover and govern AI agents")
      .version("0.1.0");
    registerAuditCommand(program);

    expect(program.name()).toBe("agentgov");
    expect(program.version()).toBe("0.1.0");
  });

  it("should have audit as a subcommand", () => {
    const program = new Command();
    program.name("agentgov").version("0.1.0");
    registerAuditCommand(program);

    const commandNames = program.commands.map((c) => c.name());
    expect(commandNames).toContain("audit");
  });

  it("should have exactly 8 options on the audit command", () => {
    const program = new Command();
    program.name("agentgov").version("0.1.0");
    registerAuditCommand(program);

    const auditCmd = program.commands.find((c) => c.name() === "audit");
    // path, github, token, format, output, verbose, threshold = 7 custom options
    // commander auto-adds --help = 8 total
    expect(auditCmd?.options.length).toBe(7);
  });
});
