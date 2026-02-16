# @agentgov/reporter

Scan report formatters for [AgentGov](https://agent-gov.com).

Formats scan results from `@agentgov/scanner` into terminal output, JSON, and standalone HTML reports.

## Installation

```bash
npm install @agentgov/reporter
```

## Usage

```typescript
import { formatTerminal, formatJson, formatHtml } from "@agentgov/reporter";
import { scan } from "@agentgov/scanner";

const result = await scan({ path: "./my-project" });

// Pretty terminal output with colors and tables
console.log(formatTerminal(result));

// Structured JSON
const json = formatJson(result);

// Standalone HTML report
const html = formatHtml(result);
```

## As a CLI

For command-line usage, install [`@agentgov/cli`](https://www.npmjs.com/package/@agentgov/cli):

```bash
npx @agentgov/cli audit --format html --output report.html
```

## Documentation

See the [main repository](https://github.com/agent-gov/agentgov) for full documentation.

## License

[Apache 2.0](./LICENSE)
