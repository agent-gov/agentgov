import { describe, it, expect } from "vitest";
import { formatTerminal } from "../src/formatters/terminal.js";
import { formatJson } from "../src/formatters/json.js";
import { formatHtml } from "../src/formatters/html.js";
import type { ScanResult } from "@agentgov/scanner";

function createMockResult(agentCount: number = 3): ScanResult {
  return {
    summary: {
      totalAgents: agentCount,
      totalFiles: 150,
      totalRepositories: 1,
      scanDuration: 1234,
      timestamp: new Date("2026-02-15T10:00:00Z"),
      scanType: "local",
      scanPath: "/test/project",
    },
    agents: Array.from({ length: agentCount }, (_, i) => ({
      id: `ag_test-${i}`,
      name: `Test Agent ${i + 1}`,
      framework: i % 2 === 0 ? ("langchain" as const) : ("crewai" as const),
      confidence: 0.7 + i * 0.1,
      location: { filePath: `src/agents/agent${i}.py` },
      metadata: {
        language: "python" as const,
        entryPoint: `src/agents/agent${i}.py`,
      },
      evidence: [
        {
          type: "import" as const,
          pattern: "test_pattern",
          matchedText: "from langchain import agent",
          filePath: `src/agents/agent${i}.py`,
          line: 1,
          confidenceContribution: 0.3,
        },
      ],
    })),
    frameworkBreakdown: {
      langchain: Math.ceil(agentCount / 2),
      crewai: Math.floor(agentCount / 2),
    },
    risks: {
      critical: 0,
      high: 0,
      medium: 1,
      low: 2,
      details: [
        { severity: "medium", type: "no_owner", description: "1 agent has no assigned owner" },
        { severity: "low", type: "undocumented", description: "2 agents lack descriptions" },
      ],
    },
    metadata: {
      scanType: "local",
      paths: ["/test/project"],
      excludedPaths: ["node_modules"],
      confidenceThreshold: 0.4,
      version: "0.1.0",
    },
  };
}

function createEmptyResult(): ScanResult {
  return {
    summary: {
      totalAgents: 0,
      totalFiles: 50,
      totalRepositories: 1,
      scanDuration: 500,
      timestamp: new Date("2026-02-15T10:00:00Z"),
      scanType: "local",
      scanPath: "/test/empty-project",
    },
    agents: [],
    frameworkBreakdown: {},
    risks: { critical: 0, high: 0, medium: 0, low: 0, details: [] },
    metadata: {
      scanType: "local",
      paths: ["/test/empty-project"],
      excludedPaths: [],
      confidenceThreshold: 0.4,
      version: "0.1.0",
    },
  };
}

describe("Terminal Formatter", () => {
  it("should produce non-empty output for results with agents", () => {
    const output = formatTerminal(createMockResult());
    expect(output.length).toBeGreaterThan(0);
  });

  it("should include agent count in output", () => {
    const output = formatTerminal(createMockResult(5));
    expect(output).toContain("5 agents");
  });

  it("should include framework names", () => {
    const output = formatTerminal(createMockResult());
    expect(output).toContain("LangChain");
    expect(output).toContain("CrewAI");
  });

  it("should include agent names in the table", () => {
    const output = formatTerminal(createMockResult());
    expect(output).toContain("Test Agent 1");
  });

  it("should include AgentGov branding", () => {
    const output = formatTerminal(createMockResult());
    expect(output).toContain("AgentGov");
    expect(output).toContain("agent-gov.com");
  });

  it("should show 'no agents' message for empty results", () => {
    const output = formatTerminal(createEmptyResult());
    expect(output).toContain("No AI agents detected");
  });

  it("should include risk flags when present", () => {
    const output = formatTerminal(createMockResult());
    expect(output).toContain("no assigned owner");
  });

  it("should handle single agent correctly (no plural)", () => {
    const output = formatTerminal(createMockResult(1));
    expect(output).toContain("1 agent");
    expect(output).not.toContain("1 agents");
  });
});

describe("JSON Formatter", () => {
  it("should produce valid JSON", () => {
    const json = formatJson(createMockResult());
    const parsed = JSON.parse(json);
    expect(parsed).toBeDefined();
    expect(parsed.summary).toBeDefined();
    expect(parsed.agents).toBeInstanceOf(Array);
  });

  it("should preserve all fields", () => {
    const result = createMockResult();
    const json = formatJson(result);
    const parsed = JSON.parse(json);

    expect(parsed.summary.totalAgents).toBe(result.summary.totalAgents);
    expect(parsed.agents.length).toBe(result.agents.length);
    expect(parsed.metadata.version).toBe(result.metadata.version);
  });

  it("should produce valid JSON for empty results", () => {
    const json = formatJson(createEmptyResult());
    const parsed = JSON.parse(json);
    expect(parsed.agents).toHaveLength(0);
  });

  it("should be pretty-printed (indented)", () => {
    const json = formatJson(createMockResult());
    expect(json).toContain("\n");
    expect(json).toContain("  ");
  });
});

describe("HTML Formatter", () => {
  it("should produce valid HTML", () => {
    const html = formatHtml(createMockResult());
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html");
    expect(html).toContain("</html>");
  });

  it("should include agent count", () => {
    const html = formatHtml(createMockResult(5));
    expect(html).toContain("5");
  });

  it("should include agent names", () => {
    const html = formatHtml(createMockResult());
    expect(html).toContain("Test Agent 1");
  });

  it("should include Chart.js script", () => {
    const html = formatHtml(createMockResult());
    expect(html).toContain("chart.js");
  });

  it("should include AgentGov branding", () => {
    const html = formatHtml(createMockResult());
    expect(html).toContain("AgentGov");
    expect(html).toContain("agent-gov.com");
  });

  it("should escape HTML in agent names", () => {
    const result = createMockResult(1);
    result.agents[0].name = '<script>alert("xss")</script>';
    const html = formatHtml(result);
    expect(html).not.toContain('<script>alert("xss")</script>');
    expect(html).toContain("&lt;script&gt;");
  });

  it("should produce standalone HTML (no external CSS files)", () => {
    const html = formatHtml(createMockResult());
    expect(html).toContain("<style>");
    // Only external dependency should be Chart.js CDN
    const linkTags = html.match(/<link[^>]+stylesheet/g);
    expect(linkTags).toBeNull();
  });
});
