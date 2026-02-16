# AgentGov

**Discover and govern AI agents in your codebase.**

Scan any codebase to find AI agents built with LangChain, CrewAI, AutoGen, OpenAI, Anthropic, and more. Get instant visibility into what agents exist, what frameworks they use, and where they live.

## Quick Start

```bash
npx @agentgov/cli audit
```

That's it. Zero config. Works on any codebase.

## Installation

```bash
# Run directly with npx (no install needed)
npx @agentgov/cli audit

# Or install globally
npm install -g @agentgov/cli
agentgov audit
```

## Usage

```bash
# Scan current directory
agentgov audit

# Scan a specific path
agentgov audit --path ./my-project

# JSON output (for CI/CD pipelines)
agentgov audit --format json --output report.json

# Standalone HTML report
agentgov audit --format html --output report.html

# Only show high-confidence detections
agentgov audit --threshold 0.8

# Verbose mode
agentgov audit --verbose
```

## Supported Frameworks

AgentGov detects 13+ AI agent frameworks across Python and TypeScript:

| Framework | Languages |
|-----------|-----------|
| LangChain | Python, TypeScript |
| LangGraph | Python |
| CrewAI | Python |
| AutoGen / AG2 | Python |
| Semantic Kernel | Python |
| Haystack | Python |
| LlamaIndex | Python |
| OpenAI Assistants | Python, TypeScript |
| Anthropic Claude | Python |
| AWS Bedrock Agents | Python |
| Google Vertex AI | Python |
| Vercel AI SDK | TypeScript |
| OpenAI SDK | TypeScript |

Detection works through multiple signals: import statements, instantiation patterns, config files (`crewai.yaml`, `.env`), dependency files (`requirements.txt`, `package.json`), and environment variables.

## How Confidence Scoring Works

Each detection produces evidence from multiple sources. Confidence scores range from 0.0 to 1.0:

| Score | Label | Meaning |
|-------|-------|---------|
| 0.8 - 1.0 | **High** | Strong evidence from multiple signals |
| 0.6 - 0.8 | **Medium** | Solid evidence, likely an agent |
| 0.4 - 0.6 | **Low** | Some evidence, may need manual review |

The default threshold is 0.4. Use `--threshold` to adjust.

## Output Formats

- **Terminal** (default) — colored tables, framework breakdown bar charts, risk flags
- **JSON** — structured data for CI/CD integration and automation
- **HTML** — standalone report with interactive charts, shareable with your team

## Risk Detection

AgentGov flags governance risks for each detected agent:

- **No owner** — agent has no git history or identifiable maintainer
- **Stale agent** — not modified in 6+ months
- **Email capability** — agent may be able to send emails
- **Database access** — agent may access databases
- **Agent spawning** — agent may create sub-agents
- **Framework sprawl** — 4+ different frameworks in one codebase
- **High agent count** — 20+ agents need governance at scale

## Project Structure

This is a pnpm monorepo with three packages:

```
packages/
  scanner/    @agentgov/scanner   - Detection engine
  reporter/   @agentgov/reporter  - Output formatters
  cli/        @agentgov/cli       - CLI interface
```

The scanner package is designed to be imported by other tools (including the upcoming AgentGov SaaS platform).

## Contributing

```bash
git clone https://github.com/agent-gov/agentgov.git
cd agentgov
pnpm install
pnpm check    # runs: security audit + lint + format + tests + build
```

Found a framework we don't detect? [Open an issue](https://github.com/agent-gov/agentgov/issues).

## License

[Apache 2.0](./LICENSE)

## Links

- Website: [agent-gov.com](https://agent-gov.com)
- GitHub: [github.com/agent-gov/agentgov](https://github.com/agent-gov/agentgov)
- Issues: [github.com/agent-gov/agentgov/issues](https://github.com/agent-gov/agentgov/issues)
