# @agentgov/scanner

AI agent discovery and scanning engine for [AgentGov](https://agent-gov.com).

Scans codebases for 13+ AI agent frameworks including LangChain, CrewAI, AutoGen, OpenAI, Anthropic, AWS Bedrock, and more.

## Installation

```bash
npm install @agentgov/scanner
```

## Usage

```typescript
import { scan } from "@agentgov/scanner";

const result = await scan({ path: "./my-project" });

console.log(`Found ${result.summary.totalAgents} agents`);
for (const agent of result.agents) {
  console.log(`  ${agent.name} (${agent.framework}) - ${agent.confidence * 100}%`);
}
```

## As a CLI

For command-line usage, install [`@agentgov/cli`](https://www.npmjs.com/package/@agentgov/cli):

```bash
npx @agentgov/cli audit
```

## Documentation

See the [main repository](https://github.com/agent-gov/agentgov) for full documentation.

## License

[Apache 2.0](./LICENSE)
