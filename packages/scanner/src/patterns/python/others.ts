import type { FrameworkPatterns } from "../../types/index.js";

export const semanticKernelPatterns: FrameworkPatterns = {
  framework: "semantic-kernel",
  displayName: "Semantic Kernel",
  languages: ["python"],
  imports: [
    {
      pattern: /from\s+semantic_kernel/,
      type: "import",
      confidence: 0.3,
      description: "Semantic Kernel import",
    },
    {
      pattern: /import\s+semantic_kernel/,
      type: "import",
      confidence: 0.3,
      description: "Semantic Kernel module import",
    },
  ],
  instantiations: [
    {
      pattern: /Kernel\s*\(\s*\)/,
      type: "instantiation",
      confidence: 0.25,
      description: "Semantic Kernel instantiation",
    },
    {
      pattern: /ChatCompletionAgent\s*\(/,
      type: "instantiation",
      confidence: 0.3,
      description: "Semantic Kernel ChatCompletionAgent",
    },
  ],
  dependencies: ["semantic-kernel"],
};

export const haystackPatterns: FrameworkPatterns = {
  framework: "haystack",
  displayName: "Haystack",
  languages: ["python"],
  imports: [
    {
      pattern: /from\s+haystack\.components\.agents/,
      type: "import",
      confidence: 0.3,
      description: "Haystack agents import",
    },
    {
      pattern: /from\s+haystack/,
      type: "import",
      confidence: 0.2,
      description: "Haystack import",
    },
  ],
  instantiations: [
    {
      pattern: /Pipeline\s*\(\s*\)/,
      type: "instantiation",
      confidence: 0.15,
      description: "Haystack Pipeline instantiation",
    },
  ],
  dependencies: ["haystack", "haystack-ai", "haystack-experimental"],
};

export const llamaindexPatterns: FrameworkPatterns = {
  framework: "llamaindex",
  displayName: "LlamaIndex",
  languages: ["python"],
  imports: [
    {
      pattern: /from\s+llama_index/,
      type: "import",
      confidence: 0.25,
      description: "LlamaIndex import",
    },
    {
      pattern: /import\s+llama_index/,
      type: "import",
      confidence: 0.25,
      description: "LlamaIndex module import",
    },
  ],
  instantiations: [
    {
      pattern: /VectorStoreIndex\s*\(/,
      type: "instantiation",
      confidence: 0.15,
      description: "LlamaIndex VectorStoreIndex",
    },
    {
      pattern: /QueryEngine\s*\(/,
      type: "instantiation",
      confidence: 0.2,
      description: "LlamaIndex QueryEngine",
    },
  ],
  dependencies: ["llama-index", "llama-index-core"],
};

export const openaiAssistantsPatterns: FrameworkPatterns = {
  framework: "openai-assistants",
  displayName: "OpenAI Assistants",
  languages: ["python"],
  imports: [
    {
      pattern: /from\s+openai\s+import/,
      type: "import",
      confidence: 0.2,
      description: "OpenAI import",
    },
    {
      pattern: /import\s+openai/,
      type: "import",
      confidence: 0.2,
      description: "OpenAI module import",
    },
  ],
  instantiations: [
    {
      pattern: /\.beta\.assistants\.create\s*\(/,
      type: "instantiation",
      confidence: 0.35,
      description: "OpenAI Assistants API create",
    },
    {
      pattern: /\.beta\.threads\.create\s*\(/,
      type: "instantiation",
      confidence: 0.25,
      description: "OpenAI Threads API create",
    },
    {
      pattern: /client\.beta\.assistants/,
      type: "instantiation",
      confidence: 0.3,
      description: "OpenAI Assistants API access",
    },
  ],
  dependencies: ["openai"],
};

export const anthropicPatterns: FrameworkPatterns = {
  framework: "anthropic-claude",
  displayName: "Anthropic Claude",
  languages: ["python"],
  imports: [
    {
      pattern: /from\s+anthropic\s+import/,
      type: "import",
      confidence: 0.2,
      description: "Anthropic import",
    },
    {
      pattern: /from\s+claude_agent_sdk/,
      type: "import",
      confidence: 0.35,
      description: "Claude Agent SDK import",
    },
  ],
  instantiations: [
    {
      pattern: /tool_use/,
      type: "code_pattern",
      confidence: 0.2,
      description: "Anthropic tool_use pattern",
    },
    {
      pattern: /ClaudeAgentOptions\s*\(/,
      type: "instantiation",
      confidence: 0.35,
      description: "Claude Agent SDK instantiation",
    },
  ],
  dependencies: ["anthropic", "claude-agent-sdk"],
};

export const awsBedrockPatterns: FrameworkPatterns = {
  framework: "aws-bedrock",
  displayName: "AWS Bedrock Agents",
  languages: ["python"],
  imports: [
    {
      pattern: /boto3\.client\s*\(\s*['"]bedrock-agent['"]\s*\)/,
      type: "import",
      confidence: 0.35,
      description: "AWS Bedrock Agent client",
    },
    {
      pattern: /boto3\.client\s*\(\s*['"]bedrock-agent-runtime['"]\s*\)/,
      type: "import",
      confidence: 0.35,
      description: "AWS Bedrock Agent Runtime client",
    },
    {
      pattern: /boto3\.client\s*\(\s*['"]bedrock['"]\s*\)/,
      type: "import",
      confidence: 0.2,
      description: "AWS Bedrock client",
    },
  ],
  instantiations: [
    {
      pattern: /create_agent\s*\(/,
      type: "instantiation",
      confidence: 0.2,
      description: "Bedrock create_agent call",
    },
    {
      pattern: /invoke_agent\s*\(/,
      type: "instantiation",
      confidence: 0.25,
      description: "Bedrock invoke_agent call",
    },
  ],
  dependencies: ["boto3"],
};

export const googleVertexPatterns: FrameworkPatterns = {
  framework: "google-vertex",
  displayName: "Google Vertex AI",
  languages: ["python"],
  imports: [
    {
      pattern: /from\s+vertexai\s+import\s+agent_engines/,
      type: "import",
      confidence: 0.35,
      description: "Vertex AI agent_engines import",
    },
    {
      pattern: /import\s+vertexai/,
      type: "import",
      confidence: 0.15,
      description: "Vertex AI import",
    },
    {
      pattern: /from\s+langchain_google_vertexai/,
      type: "import",
      confidence: 0.25,
      description: "LangChain Google Vertex AI integration",
    },
  ],
  instantiations: [
    {
      pattern: /agent_engines\.create/,
      type: "instantiation",
      confidence: 0.3,
      description: "Vertex AI agent engine creation",
    },
  ],
  dependencies: ["vertexai", "langchain-google-vertexai"],
};
