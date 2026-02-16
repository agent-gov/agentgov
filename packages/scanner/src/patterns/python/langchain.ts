import type { FrameworkPatterns } from "../../types/index.js";

export const langchainPatterns: FrameworkPatterns = {
  framework: "langchain",
  displayName: "LangChain",
  languages: ["python"],
  imports: [
    {
      pattern: /from\s+langchain[._\s]/,
      type: "import",
      confidence: 0.3,
      description: "LangChain import",
    },
    {
      pattern: /import\s+langchain/,
      type: "import",
      confidence: 0.3,
      description: "LangChain module import",
    },
    {
      pattern: /from\s+langchain_core/,
      type: "import",
      confidence: 0.3,
      description: "LangChain Core import",
    },
    {
      pattern: /from\s+langchain_openai/,
      type: "import",
      confidence: 0.3,
      description: "LangChain OpenAI integration",
    },
    {
      pattern: /from\s+langchain_anthropic/,
      type: "import",
      confidence: 0.3,
      description: "LangChain Anthropic integration",
    },
    {
      pattern: /from\s+langchain_community/,
      type: "import",
      confidence: 0.3,
      description: "LangChain Community import",
    },
  ],
  instantiations: [
    {
      pattern: /AgentExecutor\s*\(/,
      type: "instantiation",
      confidence: 0.3,
      description: "LangChain AgentExecutor instantiation",
    },
    {
      pattern: /create_react_agent\s*\(/,
      type: "instantiation",
      confidence: 0.3,
      description: "LangChain React agent creation",
    },
    {
      pattern: /create_openai_functions_agent\s*\(/,
      type: "instantiation",
      confidence: 0.3,
      description: "LangChain OpenAI Functions agent",
    },
    {
      pattern: /initialize_agent\s*\(/,
      type: "instantiation",
      confidence: 0.3,
      description: "LangChain agent initialization",
    },
    {
      pattern: /create_tool_calling_agent\s*\(/,
      type: "instantiation",
      confidence: 0.3,
      description: "LangChain tool-calling agent",
    },
  ],
  dependencies: [
    "langchain",
    "langchain-core",
    "langchain-openai",
    "langchain-anthropic",
    "langchain-community",
  ],
};

export const langgraphPatterns: FrameworkPatterns = {
  framework: "langgraph",
  displayName: "LangGraph",
  languages: ["python"],
  imports: [
    {
      pattern: /from\s+langgraph/,
      type: "import",
      confidence: 0.3,
      description: "LangGraph import",
    },
    {
      pattern: /import\s+langgraph/,
      type: "import",
      confidence: 0.3,
      description: "LangGraph module import",
    },
  ],
  instantiations: [
    {
      pattern: /StateGraph\s*\(/,
      type: "instantiation",
      confidence: 0.3,
      description: "LangGraph StateGraph creation",
    },
    {
      pattern: /\.compile\s*\(\s*\)/,
      type: "instantiation",
      confidence: 0.15,
      description: "LangGraph graph compilation",
    },
    {
      pattern: /MessageGraph\s*\(/,
      type: "instantiation",
      confidence: 0.3,
      description: "LangGraph MessageGraph creation",
    },
  ],
  dependencies: ["langgraph", "langgraph-checkpoint"],
};
