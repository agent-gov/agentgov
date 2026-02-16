import { Command } from "commander";
import { registerAuditCommand } from "./commands/audit.js";

const program = new Command();

program
  .name("agentgov")
  .description(
    "AgentGov CLI — Discover and govern AI agents in your codebase\n\n" +
      "  Scan your codebase to find AI agents built with LangChain, CrewAI,\n" +
      "  AutoGen, OpenAI, Anthropic, and more. Get instant visibility into\n" +
      "  what agents exist, what frameworks they use, and where they live.",
  )
  .version("0.1.0");

// Register commands
registerAuditCommand(program);

// Parse and run
program.parse();
