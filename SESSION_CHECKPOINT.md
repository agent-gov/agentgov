# AgentGov — Session Checkpoint

**Date**: February 15, 2026
**Last Updated**: End of Session 6
**Status**: Sprint 1 complete. Code shipped to GitHub. Pre-npm-publish.

---

## What Is AgentGov

A provider-agnostic AI agent governance platform. The CLI scans codebases to discover AI agents across 13+ frameworks (LangChain, CrewAI, AutoGen, OpenAI, Anthropic, etc.), scores confidence, identifies owners via git blame, flags governance risks, and outputs reports.

**Tagline**: See every agent. Govern every risk.
**Pitch**: Discover the AI agents you didn't know you had.

---

## What Exists

### Code (Sprint 1 — Complete)

| Package | Purpose | Files |
|---------|---------|-------|
| `@agentgov/scanner` | Core detection engine | 20 source files |
| `@agentgov/reporter` | Output formatters (terminal, JSON, HTML) | 4 source files |
| `@agentgov/cli` | Command-line interface | 2 source files |

**Quality**:
- 182+ tests passing (142 scanner + 19 reporter + 21 cli)
- 8 security invariants (self-scanning tests)
- Automated quality gate: `pnpm check` → security → lint → format → test → build
- Pre-commit hooks (ESLint + Prettier)

**How to run**:
```bash
cd /Users/edlaura/Projects/Project\ 3\ -\ Building\ a\ Company/agentgov
pnpm check          # full quality gate
pnpm test           # just tests
pnpm dev -- audit   # run CLI in dev mode
```

### Git Repository

- **GitHub**: https://github.com/agent-gov/agentgov (public)
- **Branch**: `main`
- **Commits**: 2
  - `dea5bb9` — Initial commit: AgentGov CLI v0.1.0
  - `622102b` — Update tagline: replace Terraform analogy with governance focus
- **Working tree**: Clean, up to date with origin

### Documentation

| File | Description |
|------|-------------|
| `README.md` | Full project README (installation, usage, frameworks, contributing) |
| `EXECUTIVE_SUMMARY.md` | Business-oriented summary for sharing with peers/investors |
| `PITCH_DECK.html` | Standalone 12-slide HTML presentation (dark theme, keyboard nav) |
| `LICENSE` | Apache 2.0 |

### Google Slides Pitch Deck

- **URL**: https://docs.google.com/presentation/d/1Gbin4idXh4Jtq42-SimnD3NgLQcRUMf0SdUIwcgN_7E/edit
- **Slides**: 12 (Title, Problem, Solution, How It Works, Detection Coverage, What's Built, Architecture, Go-to-Market, Roadmap, Market Opportunity, Assets Secured, Next Steps)
- **Apps Script project**: https://script.google.com/u/0/home/projects/102ildu4ga0ASKo7enFffIM1ScKzmYRcWt7mdYHVssYggrJcTenFwsJ5d/edit
- Contains `buildPitchDeck()` (creates all 12 slides) and `updateTagline()` helper

### Brand Assets Secured

| Asset | Value | Status |
|-------|-------|--------|
| Domain | agent-gov.com | Purchased ✅ |
| GitHub org | github.com/agent-gov | Created ✅ |
| npm org | @agentgov | Created, pending support ⚠️ |
| Twitter/X | @agentgov_ai | Created ✅ |

---

## What's Blocked

### npm Publish — Ticket #4088501

The `@agentgov` npm organization was created but something went wrong with the setup. Support ticket #4088501 is open with npm. Until this resolves, we cannot run `pnpm publish --recursive`. Once resolved:

```bash
pnpm build
pnpm publish --recursive --access public
```

---

## What's Not Done (Next Session)

### Immediate (unblock shipping)

1. **Resolve npm org ticket** — Check status of #4088501, follow up if needed
2. **npm publish v0.1.0** — Once org is resolved
3. **E2E test on real repos** — Run against real LangChain/CrewAI repos to validate detection accuracy

### Optional Cleanup

4. **Fix esbuild vulnerability** — `pnpm update vitest vite --recursive` (1 moderate dev dep)
5. **GitHub Actions CI** — Automate `pnpm check` on PRs

### Sprint 2 (SaaS MVP)

6. **Next.js web dashboard** — `packages/web/`
7. **Neon PostgreSQL + Drizzle ORM** — `packages/db/`
8. **Clerk authentication** — `packages/auth/`
9. **GitHub org scanning** — Server-side batch scanning
10. **Agent registry** — Persistent storage of discovered agents
11. **CLI `--upload` flag** — Send scan results to SaaS platform

---

## Technical Reference

### Project Structure

```
agentgov/
├── packages/
│   ├── cli/           # Commander.js CLI, bin/agentgov.js
│   ├── scanner/       # Detection engine, patterns, enrichers
│   └── reporter/      # Terminal, JSON, HTML formatters
├── package.json       # Root workspace (pnpm)
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── vitest.workspace.ts
├── eslint.config.js
└── .prettierrc
```

### Tech Stack

| Layer | Choice |
|-------|--------|
| Package manager | pnpm (workspaces) |
| Language | TypeScript (ESM) |
| Build | tsup (esbuild) |
| Test | Vitest |
| CLI | Commander.js |
| File scanning | fast-glob + ignore |
| Git integration | simple-git |
| License | Apache 2.0 |

### Key Design Decisions

All decisions designed to be reversible — no one-way doors:

- **Monorepo**: Scanner package reusable by future SaaS app
- **Regex detection**: Swappable for AST parsing later
- **Apache 2.0**: SaaS layer can be proprietary
- **Stateless**: Database is additive in Sprint 2
- **TypeScript ESM**: Same runtime as future Next.js app

### Plan File

The full implementation plan (all sprints) is at:
`/Users/edlaura/.claude/plans/composed-noodling-globe.md`

---

## Session History

| Session | What Was Done |
|---------|---------------|
| 1 | Project planning, 9 key decisions, MVP spec |
| 2 | Sprint 1 foundation — monorepo, scanner, patterns |
| 3 | Complete pattern library, enrichment, risk detection |
| 4 | CLI, reporters, polish, README, ship prep |
| 5 | Security review gate, quality gate, 182 tests |
| 6 | Executive summary, pitch deck (Google Slides + HTML), git init, GitHub push, tagline update |
