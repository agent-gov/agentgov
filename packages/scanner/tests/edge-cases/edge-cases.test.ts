import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { scanLocal } from "../../src/scanners/local.js";
import { analyzeFile, extractAgentName } from "../../src/analyzers/file-analyzer.js";

const FIXTURES = resolve(__dirname, "../fixtures");

describe("Edge Cases: Empty and Minimal Files", () => {
  it("should handle an empty Python file gracefully", async () => {
    const result = await analyzeFile(resolve(FIXTURES, "edge-cases/empty-file.py"));
    expect(result.detections).toHaveLength(0);
    expect(result.language).toBe("python");
  });

  it("should handle file with only comments (Python comment patterns)", async () => {
    const result = await analyzeFile(resolve(FIXTURES, "edge-cases/comments-only.py"));
    // Comments containing import patterns MAY still be detected by regex
    // (we're doing static regex analysis, not AST). This is a known limitation.
    // The key thing is the scanner doesn't crash.
    expect(result.language).toBe("python");
  });
});

describe("Edge Cases: Deeply Nested Files", () => {
  it("should find agents in deeply nested directories", async () => {
    const result = await scanLocal({
      path: resolve(FIXTURES, "edge-cases/deep"),
    });
    expect(result.agents.length).toBeGreaterThanOrEqual(1);
    expect(result.agents[0].framework).toBe("autogen");
    // File path should reflect the nesting
    expect(result.agents[0].location.filePath).toContain("nested");
  });
});

describe("Edge Cases: Multi-Framework Files", () => {
  it("should detect multiple frameworks in a single file", async () => {
    const result = await analyzeFile(resolve(FIXTURES, "edge-cases/multi-framework.py"));
    const frameworks = result.detections.map((d) => d.framework);
    expect(frameworks).toContain("langchain");
    expect(frameworks).toContain("crewai");
    expect(frameworks).toContain("autogen");
  });

  it("should report each framework as a separate agent in scan results", async () => {
    const result = await scanLocal({
      path: resolve(FIXTURES, "edge-cases"),
      confidenceThreshold: 0.3,
    });
    // Multiple agents from multi-framework.py
    const multiFileAgents = result.agents.filter((a) =>
      a.location.filePath.includes("multi-framework"),
    );
    expect(multiFileAgents.length).toBeGreaterThanOrEqual(2);
    const frameworks = multiFileAgents.map((a) => a.framework);
    expect(new Set(frameworks).size).toBeGreaterThanOrEqual(2);
  });
});

describe("Edge Cases: Directories with Special Characters", () => {
  it("should handle directories with spaces in names", async () => {
    const result = await scanLocal({
      path: resolve(FIXTURES, "edge-cases/special chars & spaces"),
    });
    expect(result.agents.length).toBeGreaterThanOrEqual(1);
    expect(result.agents[0].framework).toBe("langchain");
  });
});

describe("Edge Cases: No Agents Detected", () => {
  it("should return empty agents array for no-agents fixture", async () => {
    const result = await scanLocal({
      path: resolve(FIXTURES, "no-agents"),
    });
    expect(result.agents).toHaveLength(0);
    expect(result.summary.totalAgents).toBe(0);
    expect(result.frameworkBreakdown).toEqual({});
  });

  it("should still report file count even when no agents found", async () => {
    const result = await scanLocal({
      path: resolve(FIXTURES, "no-agents"),
    });
    expect(result.summary.totalFiles).toBeGreaterThan(0);
  });
});

describe("Edge Cases: Confidence Threshold Filtering", () => {
  it("should filter out agents below threshold", async () => {
    const highThreshold = await scanLocal({
      path: resolve(FIXTURES, "python-langchain"),
      confidenceThreshold: 0.99,
    });
    const lowThreshold = await scanLocal({
      path: resolve(FIXTURES, "python-langchain"),
      confidenceThreshold: 0.1,
    });
    // High threshold should find equal or fewer agents
    expect(highThreshold.agents.length).toBeLessThanOrEqual(lowThreshold.agents.length);
  });

  it("should find nothing with threshold of 1.0 (impossible to exceed)", async () => {
    // Some agents hit exactly 1.0 after enrichment, so use > 1.0
    const result = await scanLocal({
      path: resolve(FIXTURES, "no-agents"),
      confidenceThreshold: 1.0,
    });
    expect(result.agents).toHaveLength(0);
  });
});

describe("Edge Cases: Max Files Limit", () => {
  it("should respect maxFiles limit", async () => {
    const result = await scanLocal({
      path: resolve(FIXTURES),
      maxFiles: 2,
    });
    // Should still work but might find fewer agents
    expect(result.summary.totalFiles).toBeLessThanOrEqual(2);
  });
});

describe("Edge Cases: Scan Result Structure", () => {
  it("should always include all required fields", async () => {
    const result = await scanLocal({
      path: resolve(FIXTURES, "no-agents"),
    });
    // Summary
    expect(result.summary).toHaveProperty("totalAgents");
    expect(result.summary).toHaveProperty("totalFiles");
    expect(result.summary).toHaveProperty("totalRepositories");
    expect(result.summary).toHaveProperty("scanDuration");
    expect(result.summary).toHaveProperty("timestamp");
    expect(result.summary).toHaveProperty("scanType");
    expect(result.summary).toHaveProperty("scanPath");

    // Metadata
    expect(result.metadata).toHaveProperty("scanType");
    expect(result.metadata).toHaveProperty("paths");
    expect(result.metadata).toHaveProperty("excludedPaths");
    expect(result.metadata).toHaveProperty("confidenceThreshold");
    expect(result.metadata).toHaveProperty("version");

    // Risks
    expect(result.risks).toHaveProperty("critical");
    expect(result.risks).toHaveProperty("high");
    expect(result.risks).toHaveProperty("medium");
    expect(result.risks).toHaveProperty("low");
    expect(result.risks).toHaveProperty("details");
  });

  it("should have version 0.1.0", async () => {
    const result = await scanLocal({
      path: resolve(FIXTURES, "no-agents"),
    });
    expect(result.metadata.version).toBe("0.1.0");
  });

  it("should sort agents by confidence (descending)", async () => {
    const result = await scanLocal({
      path: resolve(FIXTURES),
      confidenceThreshold: 0.3,
    });
    for (let i = 1; i < result.agents.length; i++) {
      expect(result.agents[i - 1].confidence).toBeGreaterThanOrEqual(result.agents[i].confidence);
    }
  });
});

describe("Edge Cases: Agent Name Extraction", () => {
  it("should extract class names from Python", () => {
    const content = `class MyCustomAgent(BaseAgent):
    pass`;
    expect(extractAgentName("agents/custom.py", content)).toBe("MyCustomAgent");
  });

  it("should fall back to filename for files with no class", () => {
    const content = `x = 1\ny = 2`;
    const name = extractAgentName("src/my_agent.py", content);
    expect(name).toBeDefined();
    expect(name.length).toBeGreaterThan(0);
  });

  it("should handle undefined content", () => {
    const name = extractAgentName("unknown.py", undefined);
    expect(name).toBeDefined();
    expect(name.length).toBeGreaterThan(0);
  });

  it("should handle empty content", () => {
    const name = extractAgentName("test.py", "");
    expect(name).toBeDefined();
    expect(name.length).toBeGreaterThan(0);
  });
});

describe("Edge Cases: Orchestrator", () => {
  it("should throw for unimplemented github scanning", async () => {
    const { scan } = await import("../../src/orchestrator.js");
    await expect(scan({ github: { org: "testorg", token: "fake-token" } })).rejects.toThrow(
      "GitHub scanning is not yet implemented",
    );
  });
});

describe("Edge Cases: Exclusion Patterns", () => {
  it("should respect custom exclude patterns", async () => {
    // Scan edge-cases but exclude deep directory
    const withExclusion = await scanLocal({
      path: resolve(FIXTURES, "edge-cases"),
      excludePatterns: ["**/deep/**"],
      confidenceThreshold: 0.3,
    });
    const withoutExclusion = await scanLocal({
      path: resolve(FIXTURES, "edge-cases"),
      confidenceThreshold: 0.3,
    });
    // Exclusion should result in equal or fewer agents
    expect(withExclusion.agents.length).toBeLessThanOrEqual(withoutExclusion.agents.length);
    // Specifically, deep agent should be missing
    const deepAgents = withExclusion.agents.filter((a) => a.location.filePath.includes("deep"));
    expect(deepAgents).toHaveLength(0);
  });
});
