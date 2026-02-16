import type { FrameworkPatterns } from "../../types/index.js";

export const langchainJsPatterns: FrameworkPatterns = {
  framework: "langchain",
  displayName: "LangChain.js",
  languages: ["typescript", "javascript"],
  imports: [
    {
      pattern: /from\s+["']langchain/,
      type: "import",
      confidence: 0.3,
      description: "LangChain.js import",
    },
    {
      pattern: /from\s+["']@langchain\//,
      type: "import",
      confidence: 0.3,
      description: "LangChain.js scoped import",
    },
    {
      pattern: /require\s*\(\s*["']langchain/,
      type: "import",
      confidence: 0.3,
      description: "LangChain.js require",
    },
  ],
  instantiations: [
    {
      pattern: /new\s+AgentExecutor\s*\(/,
      type: "instantiation",
      confidence: 0.3,
      description: "LangChain.js AgentExecutor",
    },
    {
      pattern: /createReactAgent\s*\(/,
      type: "instantiation",
      confidence: 0.3,
      description: "LangChain.js React agent",
    },
    {
      pattern: /createOpenAIFunctionsAgent\s*\(/,
      type: "instantiation",
      confidence: 0.3,
      description: "LangChain.js OpenAI Functions agent",
    },
    {
      pattern: /initializeAgent\s*\(/,
      type: "instantiation",
      confidence: 0.3,
      description: "LangChain.js agent initialization",
    },
  ],
  dependencies: [
    "langchain",
    "@langchain/core",
    "@langchain/openai",
    "@langchain/anthropic",
    "@langchain/community",
  ],
};
