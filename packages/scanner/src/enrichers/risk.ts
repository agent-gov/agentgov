/**
 * Risk Detection Engine
 *
 * Analyzes agent records for potential governance risks. Each risk rule
 * is a simple function that checks agent data and returns a RiskFlag
 * if the condition is met.
 *
 * Risk categories:
 * - Ownership: unowned agents, single-author agents
 * - Security: external API calls, database access, email capabilities
 * - Compliance: no logging, no audit trail, stale agents
 * - Operational: high tool count, agent spawning
 */

import type { AgentRecord, RiskFlag, RiskSeverity } from "../types/index.js";

/**
 * A risk rule that evaluates an agent and optionally returns a RiskFlag
 */
interface RiskRule {
  id: string;
  evaluate: (agent: AgentRecord) => RiskFlag | null;
}

// ─── Risk Rules ──────────────────────────────────────────────────────────────

const RISK_RULES: RiskRule[] = [
  {
    id: "no-owner",
    evaluate: (agent) => {
      if (!agent.metadata.owner) {
        return {
          severity: "medium",
          type: "no-owner",
          description: `Agent "${agent.name}" has no identified owner (no git history)`,
        };
      }
      return null;
    },
  },

  {
    id: "stale-agent",
    evaluate: (agent) => {
      if (agent.metadata.lastModified) {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        if (agent.metadata.lastModified < sixMonthsAgo) {
          const months = Math.floor(
            (Date.now() - agent.metadata.lastModified.getTime()) / (1000 * 60 * 60 * 24 * 30),
          );
          return {
            severity: "low",
            type: "stale-agent",
            description: `Agent "${agent.name}" hasn't been modified in ${months} months`,
          };
        }
      }
      return null;
    },
  },

  {
    id: "low-confidence",
    evaluate: (agent) => {
      if (agent.confidence < 0.6 && agent.confidence >= 0.4) {
        return {
          severity: "low",
          type: "low-confidence",
          description: `Agent "${agent.name}" detected with low confidence (${(agent.confidence * 100).toFixed(0)}%) — may be a false positive`,
        };
      }
      return null;
    },
  },

  {
    id: "database-access",
    evaluate: (agent) => {
      // Check evidence for database-related patterns
      const dbPatterns = [
        /database/i,
        /\bsql\b/i,
        /\bdb\b/i,
        /postgres/i,
        /mysql/i,
        /mongo/i,
        /redis/i,
        /dynamo/i,
        /supabase/i,
      ];
      for (const evidence of agent.evidence) {
        for (const pattern of dbPatterns) {
          if (pattern.test(evidence.matchedText)) {
            return {
              severity: "medium",
              type: "database-access",
              description: `Agent "${agent.name}" may have database access`,
            };
          }
        }
      }
      // Also check capabilities if populated
      if (agent.capabilities?.hasDatabase) {
        return {
          severity: "medium",
          type: "database-access",
          description: `Agent "${agent.name}" has database access capabilities`,
        };
      }
      return null;
    },
  },

  {
    id: "email-capability",
    evaluate: (agent) => {
      const emailPatterns = [/send_email/i, /sendmail/i, /smtp/i, /email.*tool/i, /mail.*send/i];
      for (const evidence of agent.evidence) {
        for (const pattern of emailPatterns) {
          if (pattern.test(evidence.matchedText)) {
            return {
              severity: "high",
              type: "email-capability",
              description: `Agent "${agent.name}" may be able to send emails`,
            };
          }
        }
      }
      if (agent.capabilities?.canSendEmail) {
        return {
          severity: "high",
          type: "email-capability",
          description: `Agent "${agent.name}" can send emails`,
        };
      }
      return null;
    },
  },

  {
    id: "agent-spawning",
    evaluate: (agent) => {
      const spawnPatterns = [
        /sub.?agent/i,
        /spawn.*agent/i,
        /create.*agent/i,
        /child.*agent/i,
        /nested.*agent/i,
      ];
      for (const evidence of agent.evidence) {
        for (const pattern of spawnPatterns) {
          if (pattern.test(evidence.matchedText)) {
            return {
              severity: "medium",
              type: "agent-spawning",
              description: `Agent "${agent.name}" may spawn sub-agents`,
            };
          }
        }
      }
      if (agent.capabilities?.canSpawnAgents) {
        return {
          severity: "medium",
          type: "agent-spawning",
          description: `Agent "${agent.name}" can spawn sub-agents`,
        };
      }
      return null;
    },
  },

  {
    id: "external-api",
    evaluate: (agent) => {
      const apiPatterns = [
        /requests\.(get|post|put|delete|patch)/i,
        /fetch\s*\(/,
        /axios/i,
        /httpx/i,
        /urllib/i,
        /aiohttp/i,
      ];
      for (const evidence of agent.evidence) {
        for (const pattern of apiPatterns) {
          if (pattern.test(evidence.matchedText)) {
            return {
              severity: "low",
              type: "external-api",
              description: `Agent "${agent.name}" may make external API calls`,
            };
          }
        }
      }
      return null;
    },
  },

  {
    id: "multiple-frameworks",
    evaluate: (_agent) => {
      // This is checked at the scan level, not per-agent
      // Included here as a placeholder — the scan-level check handles it
      return null;
    },
  },
];

/**
 * Evaluate all risk rules against a single agent.
 * Returns the list of flagged risks.
 */
export function evaluateAgentRisks(agent: AgentRecord): RiskFlag[] {
  const risks: RiskFlag[] = [];
  for (const rule of RISK_RULES) {
    const result = rule.evaluate(agent);
    if (result) {
      risks.push(result);
    }
  }
  return risks;
}

/**
 * Enrich all agents with risk flags and compute scan-level risk summary.
 */
export function enrichWithRisks(agents: AgentRecord[]): {
  critical: number;
  high: number;
  medium: number;
  low: number;
  details: RiskFlag[];
} {
  const allRisks: RiskFlag[] = [];
  const counts: Record<RiskSeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const agent of agents) {
    const agentRisks = evaluateAgentRisks(agent);
    agent.risks = agentRisks;

    for (const risk of agentRisks) {
      allRisks.push(risk);
      counts[risk.severity]++;
    }
  }

  // Add scan-level risks (not per-agent)
  // Check for framework sprawl (many different frameworks in one codebase)
  const uniqueFrameworks = new Set(agents.map((a) => a.framework));
  if (uniqueFrameworks.size >= 4) {
    const sprawlRisk: RiskFlag = {
      severity: "medium",
      type: "framework-sprawl",
      description: `${uniqueFrameworks.size} different agent frameworks detected — consider standardizing`,
    };
    allRisks.push(sprawlRisk);
    counts.medium++;
  }

  // Check for high agent count (organizational risk)
  if (agents.length > 20) {
    const countRisk: RiskFlag = {
      severity: "high",
      type: "high-agent-count",
      description: `${agents.length} agents detected — governance becomes critical at this scale`,
    };
    allRisks.push(countRisk);
    counts.high++;
  }

  return {
    ...counts,
    details: allRisks,
  };
}
