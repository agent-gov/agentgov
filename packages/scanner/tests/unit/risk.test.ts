import { describe, it, expect } from "vitest";
import { evaluateAgentRisks, enrichWithRisks } from "../../src/enrichers/risk.js";
import type { AgentRecord } from "../../src/types/index.js";

/**
 * Helper to create a minimal agent record for testing
 */
function makeAgent(overrides: Partial<AgentRecord> = {}): AgentRecord {
  return {
    id: "ag_test-1",
    name: "Test Agent",
    framework: "langchain",
    confidence: 0.9,
    location: { filePath: "test/agent.py" },
    metadata: { language: "python" },
    evidence: [],
    ...overrides,
  };
}

describe("Risk Detection: evaluateAgentRisks", () => {
  describe("no-owner rule", () => {
    it("should flag agents with no owner", () => {
      const agent = makeAgent({ metadata: { language: "python" } });
      const risks = evaluateAgentRisks(agent);
      const noOwner = risks.find((r) => r.type === "no-owner");
      expect(noOwner).toBeDefined();
      expect(noOwner!.severity).toBe("medium");
    });

    it("should not flag agents with an owner", () => {
      const agent = makeAgent({
        metadata: { language: "python", owner: "Jane Doe" },
      });
      const risks = evaluateAgentRisks(agent);
      expect(risks.find((r) => r.type === "no-owner")).toBeUndefined();
    });
  });

  describe("stale-agent rule", () => {
    it("should flag agents not modified in 6+ months", () => {
      const eightMonthsAgo = new Date();
      eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 8);
      const agent = makeAgent({
        metadata: { language: "python", lastModified: eightMonthsAgo },
      });
      const risks = evaluateAgentRisks(agent);
      const stale = risks.find((r) => r.type === "stale-agent");
      expect(stale).toBeDefined();
      expect(stale!.severity).toBe("low");
      expect(stale!.description).toContain("months");
    });

    it("should not flag recently modified agents", () => {
      const agent = makeAgent({
        metadata: { language: "python", lastModified: new Date() },
      });
      const risks = evaluateAgentRisks(agent);
      expect(risks.find((r) => r.type === "stale-agent")).toBeUndefined();
    });

    it("should not flag agents with no lastModified", () => {
      const agent = makeAgent({ metadata: { language: "python" } });
      const risks = evaluateAgentRisks(agent);
      expect(risks.find((r) => r.type === "stale-agent")).toBeUndefined();
    });
  });

  describe("low-confidence rule", () => {
    it("should flag agents with confidence 0.4-0.6", () => {
      const agent = makeAgent({ confidence: 0.5 });
      const risks = evaluateAgentRisks(agent);
      const low = risks.find((r) => r.type === "low-confidence");
      expect(low).toBeDefined();
      expect(low!.severity).toBe("low");
      expect(low!.description).toContain("50%");
    });

    it("should not flag agents with high confidence", () => {
      const agent = makeAgent({ confidence: 0.9 });
      const risks = evaluateAgentRisks(agent);
      expect(risks.find((r) => r.type === "low-confidence")).toBeUndefined();
    });

    it("should not flag agents with confidence at exactly 0.6", () => {
      const agent = makeAgent({ confidence: 0.6 });
      const risks = evaluateAgentRisks(agent);
      expect(risks.find((r) => r.type === "low-confidence")).toBeUndefined();
    });
  });

  describe("database-access rule", () => {
    it("should flag agents with database patterns in evidence", () => {
      const agent = makeAgent({
        evidence: [
          {
            type: "code_pattern",
            pattern: "test",
            matchedText: "connection = postgres://localhost/mydb",
            filePath: "agent.py",
            confidenceContribution: 0.1,
          },
        ],
      });
      const risks = evaluateAgentRisks(agent);
      expect(risks.find((r) => r.type === "database-access")).toBeDefined();
    });

    it("should flag agents with hasDatabase capability", () => {
      const agent = makeAgent({
        capabilities: { hasDatabase: true },
      });
      const risks = evaluateAgentRisks(agent);
      expect(risks.find((r) => r.type === "database-access")).toBeDefined();
    });

    it("should not flag agents without database indicators", () => {
      const agent = makeAgent({
        evidence: [
          {
            type: "import",
            pattern: "test",
            matchedText: "from langchain import Agent",
            filePath: "agent.py",
            confidenceContribution: 0.3,
          },
        ],
      });
      const risks = evaluateAgentRisks(agent);
      expect(risks.find((r) => r.type === "database-access")).toBeUndefined();
    });
  });

  describe("email-capability rule", () => {
    it("should flag agents with email patterns", () => {
      const agent = makeAgent({
        evidence: [
          {
            type: "code_pattern",
            pattern: "test",
            matchedText: "send_email(to='admin@example.com')",
            filePath: "agent.py",
            confidenceContribution: 0.1,
          },
        ],
      });
      const risks = evaluateAgentRisks(agent);
      const email = risks.find((r) => r.type === "email-capability");
      expect(email).toBeDefined();
      expect(email!.severity).toBe("high");
    });

    it("should flag agents with canSendEmail capability", () => {
      const agent = makeAgent({
        capabilities: { canSendEmail: true },
      });
      const risks = evaluateAgentRisks(agent);
      expect(risks.find((r) => r.type === "email-capability")).toBeDefined();
    });
  });

  describe("agent-spawning rule", () => {
    it("should flag agents with sub-agent patterns", () => {
      const agent = makeAgent({
        evidence: [
          {
            type: "code_pattern",
            pattern: "test",
            matchedText: "create_sub_agent(role='researcher')",
            filePath: "agent.py",
            confidenceContribution: 0.1,
          },
        ],
      });
      const risks = evaluateAgentRisks(agent);
      expect(risks.find((r) => r.type === "agent-spawning")).toBeDefined();
    });

    it("should flag agents with canSpawnAgents capability", () => {
      const agent = makeAgent({
        capabilities: { canSpawnAgents: true },
      });
      const risks = evaluateAgentRisks(agent);
      expect(risks.find((r) => r.type === "agent-spawning")).toBeDefined();
    });
  });

  describe("external-api rule", () => {
    it("should flag agents with HTTP request patterns", () => {
      const agent = makeAgent({
        evidence: [
          {
            type: "code_pattern",
            pattern: "test",
            matchedText: "requests.post('https://api.example.com')",
            filePath: "agent.py",
            confidenceContribution: 0.1,
          },
        ],
      });
      const risks = evaluateAgentRisks(agent);
      expect(risks.find((r) => r.type === "external-api")).toBeDefined();
    });
  });
});

describe("Risk Detection: enrichWithRisks (scan-level)", () => {
  it("should set agent.risks on each agent", () => {
    const agents = [makeAgent(), makeAgent({ id: "ag_test-2", name: "Agent 2" })];
    enrichWithRisks(agents);
    for (const agent of agents) {
      expect(agent.risks).toBeDefined();
      expect(Array.isArray(agent.risks)).toBe(true);
    }
  });

  it("should return correct severity counts", () => {
    const agents = [
      makeAgent({ confidence: 0.5 }), // low-confidence (low)
      makeAgent({ id: "ag_2", name: "Agent 2", confidence: 0.45 }), // low-confidence (low)
    ];
    const result = enrichWithRisks(agents);
    expect(result.low).toBeGreaterThanOrEqual(2); // at least 2 low-confidence + no-owner
    expect(result.details.length).toBeGreaterThan(0);
  });

  it("should flag framework sprawl when 4+ frameworks detected", () => {
    const agents = [
      makeAgent({ framework: "langchain" }),
      makeAgent({ id: "ag_2", name: "A2", framework: "crewai" }),
      makeAgent({ id: "ag_3", name: "A3", framework: "autogen" }),
      makeAgent({ id: "ag_4", name: "A4", framework: "openai-assistants" }),
    ];
    const result = enrichWithRisks(agents);
    const sprawl = result.details.find((r) => r.type === "framework-sprawl");
    expect(sprawl).toBeDefined();
    expect(sprawl!.severity).toBe("medium");
    expect(sprawl!.description).toContain("4");
  });

  it("should not flag framework sprawl with fewer than 4 frameworks", () => {
    const agents = [
      makeAgent({ framework: "langchain" }),
      makeAgent({ id: "ag_2", name: "A2", framework: "crewai" }),
    ];
    const result = enrichWithRisks(agents);
    expect(result.details.find((r) => r.type === "framework-sprawl")).toBeUndefined();
  });

  it("should flag high agent count when > 20 agents", () => {
    const agents = Array.from({ length: 25 }, (_, i) =>
      makeAgent({ id: `ag_${i}`, name: `Agent ${i}` }),
    );
    const result = enrichWithRisks(agents);
    const countRisk = result.details.find((r) => r.type === "high-agent-count");
    expect(countRisk).toBeDefined();
    expect(countRisk!.severity).toBe("high");
  });

  it("should not flag high agent count with <= 20 agents", () => {
    const agents = [makeAgent()];
    const result = enrichWithRisks(agents);
    expect(result.details.find((r) => r.type === "high-agent-count")).toBeUndefined();
  });
});
