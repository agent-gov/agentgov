# AgentGov — Executive Summary

**Date**: February 2026
**Status**: Sprint 1 complete (CLI tool built), pre-launch
**Tagline**: Terraform for the AI agent era

---

## The Problem

Every company is deploying AI agents — but nobody knows how many they have, who owns them, or what they can do.

AI agents are proliferating across enterprises through LangChain, CrewAI, AutoGen, OpenAI Assistants, and 10+ other frameworks. Unlike traditional software (which lives in known repos with clear ownership), agents are being spun up by individual developers across teams with no central visibility. A company might think they have 12 agents — and actually have 47.

There is no "terraform plan" equivalent for AI agents. No way to discover what exists, assess governance gaps, or enforce policies. This is a growing compliance and security blind spot.

## The Solution

**AgentGov** is an AI agent governance platform that gives organizations complete visibility into their AI agent landscape.

It works in two layers:

1. **Agent Audit CLI** (built, open-source, free) — A zero-config CLI tool that scans any codebase and discovers AI agents across 13+ frameworks. Developers run `npx @agentgov/cli audit` and instantly see every agent, its framework, confidence level, owner, and risk flags.

2. **AgentGov Platform** (planned, SaaS, paid) — A web dashboard for continuous agent governance: org-wide scanning, agent registry, policy enforcement, compliance reporting, and team collaboration. Think "Snyk for AI agents."

## What's Been Built (Sprint 1)

### Working Software

A complete, tested CLI tool across 3 npm packages in a pnpm monorepo:

| Package | Purpose | Status |
|---------|---------|--------|
| `@agentgov/scanner` | Core detection engine (20 source files) | Complete |
| `@agentgov/reporter` | Output formatters (terminal, JSON, HTML) | Complete |
| `@agentgov/cli` | Command-line interface | Complete |

**Total**: 26 source files, 10 test files, 182+ passing tests.

### What It Does

```bash
npx @agentgov/cli audit
```

This single command:
- Scans the current directory (or any path via `--path`)
- Detects AI agents across 13+ frameworks (Python and TypeScript)
- Calculates confidence scores (0.0-1.0) using multi-signal analysis
- Identifies agent owners via git blame
- Flags governance risks (no owner, stale agents, email capability, database access, agent spawning, framework sprawl)
- Outputs results as colored terminal tables, structured JSON, or standalone HTML reports

### Detection Coverage

| Framework | Language | Detection |
|-----------|----------|-----------|
| LangChain / LangGraph | Python, TypeScript | Import + instantiation + deps |
| CrewAI | Python | Import + config files (crewai.yaml) |
| AutoGen / AG2 | Python | Import + instantiation |
| Semantic Kernel | Python | Import + instantiation |
| Haystack | Python | Import + instantiation |
| LlamaIndex | Python | Import + instantiation |
| OpenAI Assistants | Python, TypeScript | Import + API patterns |
| Anthropic Claude | Python | Import + tool_use patterns |
| AWS Bedrock Agents | Python | Import + client patterns |
| Google Vertex AI | Python | Import + agent_engines |
| Vercel AI SDK | TypeScript | Import + generateText/streamText |
| OpenAI SDK | TypeScript | Import + completions + tools |

Detection uses multiple signals per framework: import statements, instantiation patterns, config files, dependency files (requirements.txt, package.json, pyproject.toml), environment variables, and Dockerfiles.

### Confidence Scoring

Each detection aggregates evidence from multiple sources:

```
+0.3  Import pattern matched
+0.3  Instantiation/usage pattern matched
+0.1  Config file found
+0.1  Entry point identifiable
+0.1  Environment variables reference LLM providers
+0.1  Multiple corroborating signals
────
1.0   Maximum confidence
```

Agents scoring ≥0.4 are reported. Agents ≥0.8 are high-confidence.

### Risk Detection

7 per-agent risk rules:
- **No owner** — no git history or identifiable maintainer
- **Stale agent** — not modified in 6+ months
- **Email capability** — agent may send emails
- **Database access** — agent may access databases
- **Agent spawning** — agent may create sub-agents
- **External API access** — agent calls external services
- **Low confidence** — detection below 0.6 confidence

2 scan-level risk rules:
- **Framework sprawl** — 4+ different frameworks in one codebase
- **High agent count** — 20+ agents requiring governance at scale

### Quality & Security

- **182+ automated tests** covering unit, integration, edge cases, and security
- **8 security invariants** (self-scanning tests that grep own source code):
  - API key values never stored in output
  - Evidence text capped at 200 characters
  - HTML output XSS-escaped on all user-controlled fields
  - No secrets in source code
  - Controlled environment variable access
- **Automated quality gate**: `pnpm check` runs security audit → lint → format check → tests → build
- **Pre-commit hooks**: ESLint + Prettier auto-run on staged files
- **Static analysis only** — never executes scanned code, never stores secrets

## Architecture Decisions

Key decisions made with reversibility in mind:

| Decision | Choice | Reversible? |
|----------|--------|------------|
| Monorepo structure | pnpm workspaces (3 packages) | Scanner already decoupled for SaaS import |
| Detection method | Regex pattern matching | Swappable for AST parsing later |
| License | Apache 2.0 (open-source CLI) | SaaS layer can be proprietary |
| State | Stateless (no database) | Database is additive in Sprint 2 |
| Language | TypeScript (ESM) | Same as future Next.js SaaS |
| Testing | Vitest + security invariants | Comprehensive from day one |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (ES2022, ESM) |
| Package manager | pnpm 10.x with workspaces |
| Build | tsup (esbuild-based) |
| Test | Vitest with v8 coverage |
| CLI framework | commander.js |
| Terminal UI | picocolors, cli-table3, ora |
| File discovery | fast-glob, ignore (.gitignore) |
| Git analysis | simple-git |
| Lint/Format | ESLint 9, Prettier, lint-staged |

## Assets Secured

| Asset | Status |
|-------|--------|
| Domain: agent-gov.com | Purchased |
| GitHub org: github.com/agent-gov | Created |
| npm org: @agentgov | Pending (support ticket #4088501) |
| X/Twitter: @agentgov_ai | Created |

## Roadmap

### Sprint 2 (Days 8-20): SaaS Platform MVP

- **Web dashboard** (Next.js + Tailwind) — org-wide agent visibility
- **Database** (Neon PostgreSQL + Drizzle ORM) — persistent scan storage
- **Authentication** (Clerk) — team login and org management
- **GitHub org scanning** — scan all repos in a GitHub organization via API
- **Agent registry** — central catalog of known agents with metadata
- **`agentgov audit --upload`** — CLI pushes results to SaaS platform

### Sprint 3 (Days 20-30): Growth & Monetization

- **Policy engine** — define rules (e.g., "all agents must have an owner")
- **Compliance reports** — exportable governance reports for leadership
- **CI/CD integration** — GitHub Action for automated agent auditing
- **Notifications** — alerts when new agents appear or policies are violated
- **Team collaboration** — assign ownership, add notes, track remediation
- **Pricing tiers** — free (CLI + limited scans), pro (full platform)

### Future Vision

AgentGov becomes the central nervous system for AI agent governance:

- **Continuous monitoring** — agents are tracked across their lifecycle
- **Cross-cloud scanning** — discover agents in AWS, Azure, GCP
- **Runtime observability** — what agents are actually doing (not just where they live)
- **Compliance frameworks** — map agent inventory to SOC2, ISO 27001, EU AI Act
- **Enterprise features** — SSO, audit logs, role-based access, API

## Market Context

- AI agent adoption is accelerating (LangChain, CrewAI, AutoGen all seeing exponential growth)
- No established player in "AI agent governance" — the category is being created
- Adjacent markets (Snyk for security, Terraform for infrastructure) are multi-billion dollar categories
- Enterprises are starting to ask "how many agents do we have?" — and can't answer
- Regulatory pressure (EU AI Act) will require agent inventories

## Current Status & Next Steps

**What's done:**
- CLI tool is feature-complete and tested
- Quality gates and security invariants in place
- READMEs, LICENSE, npm publish metadata ready
- All brand assets secured

**Immediate next steps:**
1. Initialize git repo and push to GitHub
2. Resolve npm org creation (support ticket pending)
3. Publish v0.1.0 to npm
4. E2E testing against real-world open-source repos
5. Begin Sprint 2 (SaaS platform)

---

*Built with TypeScript. Apache 2.0 licensed. 26 source files, 182+ tests, zero dependencies on AI/LLM libraries.*
