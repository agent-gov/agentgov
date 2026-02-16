import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { scanLocal } from "../../src/scanners/local.js";
import { CONFIDENCE_THRESHOLDS } from "../../src/analyzers/confidence.js";

const FIXTURES_DIR = join(import.meta.dirname, "../fixtures");

describe("Local Scanner — Integration Tests", () => {
  describe("Python LangChain project", () => {
    it("should detect LangChain agents", async () => {
      const result = await scanLocal({
        path: join(FIXTURES_DIR, "python-langchain"),
      });

      expect(result.summary.totalAgents).toBeGreaterThanOrEqual(1);
      expect(result.summary.scanType).toBe("local");

      const langchainAgents = result.agents.filter((a) => a.framework === "langchain");
      expect(langchainAgents.length).toBeGreaterThanOrEqual(1);
    });

    it("should produce valid confidence scores", async () => {
      const result = await scanLocal({
        path: join(FIXTURES_DIR, "python-langchain"),
      });

      for (const agent of result.agents) {
        expect(agent.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLDS.REPORT);
        expect(agent.confidence).toBeLessThanOrEqual(1.0);
      }
    });

    it("should include evidence for each agent", async () => {
      const result = await scanLocal({
        path: join(FIXTURES_DIR, "python-langchain"),
      });

      for (const agent of result.agents) {
        expect(agent.evidence.length).toBeGreaterThanOrEqual(1);
        for (const e of agent.evidence) {
          expect(e.type).toBeDefined();
          expect(e.pattern).toBeDefined();
          expect(e.matchedText).toBeDefined();
          expect(e.confidenceContribution).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("CrewAI project", () => {
    it("should detect CrewAI agents from code and config", async () => {
      const result = await scanLocal({
        path: join(FIXTURES_DIR, "python-crewai"),
      });

      expect(result.summary.totalAgents).toBeGreaterThanOrEqual(1);

      const crewaiAgents = result.agents.filter((a) => a.framework === "crewai");
      expect(crewaiAgents.length).toBeGreaterThanOrEqual(1);
    });

    it("should detect crewai.yaml config file", async () => {
      const result = await scanLocal({
        path: join(FIXTURES_DIR, "python-crewai"),
      });

      const configAgent = result.agents.find((a) => a.location.filePath.includes("crewai.yaml"));
      expect(configAgent).toBeDefined();
    });
  });

  describe("TypeScript LangChain project", () => {
    it("should detect LangChain.js agents", async () => {
      const result = await scanLocal({
        path: join(FIXTURES_DIR, "ts-langchain"),
      });

      expect(result.summary.totalAgents).toBeGreaterThanOrEqual(1);

      const langchainAgents = result.agents.filter((a) => a.framework === "langchain");
      expect(langchainAgents.length).toBeGreaterThanOrEqual(1);

      // Should detect language as TypeScript
      const tsAgent = langchainAgents.find((a) => a.metadata.language === "typescript");
      expect(tsAgent).toBeDefined();
    });
  });

  describe("Mixed framework project", () => {
    it("should detect agents from multiple frameworks", async () => {
      const result = await scanLocal({
        path: join(FIXTURES_DIR, "mixed-project"),
      });

      expect(result.summary.totalAgents).toBeGreaterThanOrEqual(2);

      const frameworks = new Set(result.agents.map((a) => a.framework));
      expect(frameworks.size).toBeGreaterThanOrEqual(2);
      expect(frameworks.has("langchain")).toBe(true);
      expect(frameworks.has("autogen")).toBe(true);
    });

    it("should produce correct framework breakdown", async () => {
      const result = await scanLocal({
        path: join(FIXTURES_DIR, "mixed-project"),
      });

      expect(result.frameworkBreakdown).toBeDefined();
      expect(Object.keys(result.frameworkBreakdown).length).toBeGreaterThanOrEqual(2);

      // Total in breakdown should equal total agents
      const breakdownTotal = Object.values(result.frameworkBreakdown).reduce(
        (sum, count) => sum + count,
        0,
      );
      expect(breakdownTotal).toBe(result.summary.totalAgents);
    });
  });

  describe("No agents project", () => {
    it("should find zero agents in a non-agent codebase", async () => {
      const result = await scanLocal({
        path: join(FIXTURES_DIR, "no-agents"),
      });

      expect(result.summary.totalAgents).toBe(0);
      expect(result.agents).toHaveLength(0);
      expect(Object.keys(result.frameworkBreakdown)).toHaveLength(0);
    });
  });

  describe("Scan result structure", () => {
    it("should produce a valid ScanResult shape", async () => {
      const result = await scanLocal({
        path: join(FIXTURES_DIR, "python-langchain"),
      });

      // Summary
      expect(result.summary).toBeDefined();
      expect(result.summary.totalFiles).toBeGreaterThanOrEqual(1);
      expect(result.summary.scanDuration).toBeGreaterThanOrEqual(0);
      expect(result.summary.timestamp).toBeInstanceOf(Date);
      expect(result.summary.scanType).toBe("local");
      expect(result.summary.scanPath).toContain("python-langchain");

      // Metadata
      expect(result.metadata).toBeDefined();
      expect(result.metadata.scanType).toBe("local");
      expect(result.metadata.version).toBeDefined();
      expect(result.metadata.confidenceThreshold).toBe(CONFIDENCE_THRESHOLDS.REPORT);

      // Agents
      for (const agent of result.agents) {
        expect(agent.id).toMatch(/^ag_/);
        expect(agent.name).toBeTruthy();
        expect(agent.framework).toBeTruthy();
        expect(agent.location.filePath).toBeTruthy();
        expect(agent.metadata.language).toBeTruthy();
      }
    });
  });

  describe("Scan options", () => {
    it("should respect confidence threshold option", async () => {
      const strictResult = await scanLocal({
        path: join(FIXTURES_DIR, "python-crewai"),
        confidenceThreshold: 0.9,
      });

      const lenientResult = await scanLocal({
        path: join(FIXTURES_DIR, "python-crewai"),
        confidenceThreshold: 0.3,
      });

      // Stricter threshold should find fewer or equal agents
      expect(strictResult.summary.totalAgents).toBeLessThanOrEqual(
        lenientResult.summary.totalAgents,
      );
    });

    it("should work with default options (current directory)", async () => {
      // This scans the fixtures root — should find agents from all fixtures
      const result = await scanLocal({
        path: FIXTURES_DIR,
      });

      expect(result.summary.totalAgents).toBeGreaterThanOrEqual(4);
    });
  });

  describe("Progress callback", () => {
    it("should call progress callback during scan", async () => {
      const progressUpdates: Array<{ phase: string; filesScanned: number }> = [];

      await scanLocal({ path: join(FIXTURES_DIR, "python-langchain") }, (progress) => {
        progressUpdates.push({
          phase: progress.phase,
          filesScanned: progress.filesScanned,
        });
      });

      expect(progressUpdates.length).toBeGreaterThanOrEqual(1);

      // Should include discovering and complete phases
      const phases = progressUpdates.map((p) => p.phase);
      expect(phases).toContain("discovering");
      expect(phases).toContain("complete");
    });
  });

  describe("Security constraints", () => {
    it("should never include actual API key values in evidence", async () => {
      // Create a .env file in a fixture and check it's redacted
      const result = await scanLocal({
        path: FIXTURES_DIR,
      });

      for (const agent of result.agents) {
        for (const evidence of agent.evidence) {
          if (evidence.type === "env_var") {
            // Must contain "redacted" — never actual key values
            expect(evidence.matchedText).toContain("redacted");
            expect(evidence.matchedText).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);
            expect(evidence.matchedText).not.toMatch(/sk-ant-[a-zA-Z0-9]{20,}/);
          }
        }
      }
    });

    it("should truncate matched text to prevent source code leakage", async () => {
      const result = await scanLocal({
        path: FIXTURES_DIR,
      });

      for (const agent of result.agents) {
        for (const evidence of agent.evidence) {
          expect(evidence.matchedText.length).toBeLessThanOrEqual(203); // 200 + "..."
        }
      }
    });
  });
});
