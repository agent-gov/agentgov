import type { AgentFramework } from "../../types/index.js";

/**
 * Maps dependency names (in requirements.txt, pyproject.toml, package.json)
 * to their associated agent frameworks.
 */
export interface DependencyMapping {
  name: string;
  framework: AgentFramework;
  confidence: number;
  language: "python" | "typescript" | "javascript" | "any";
}

export const DEPENDENCY_MAPPINGS: DependencyMapping[] = [
  // Python frameworks
  { name: "langchain", framework: "langchain", confidence: 0.3, language: "python" },
  { name: "langchain-core", framework: "langchain", confidence: 0.3, language: "python" },
  { name: "langchain-openai", framework: "langchain", confidence: 0.3, language: "python" },
  { name: "langchain-anthropic", framework: "langchain", confidence: 0.3, language: "python" },
  { name: "langchain-community", framework: "langchain", confidence: 0.3, language: "python" },
  { name: "langgraph", framework: "langgraph", confidence: 0.3, language: "python" },
  { name: "langgraph-checkpoint", framework: "langgraph", confidence: 0.25, language: "python" },
  { name: "crewai", framework: "crewai", confidence: 0.3, language: "python" },
  { name: "crewai-tools", framework: "crewai", confidence: 0.25, language: "python" },
  { name: "autogen", framework: "autogen", confidence: 0.3, language: "python" },
  { name: "pyautogen", framework: "autogen", confidence: 0.3, language: "python" },
  { name: "ag2", framework: "autogen", confidence: 0.3, language: "python" },
  { name: "autogen-agentchat", framework: "autogen", confidence: 0.3, language: "python" },
  { name: "semantic-kernel", framework: "semantic-kernel", confidence: 0.3, language: "python" },
  { name: "haystack-ai", framework: "haystack", confidence: 0.3, language: "python" },
  { name: "haystack", framework: "haystack", confidence: 0.25, language: "python" },
  { name: "llama-index", framework: "llamaindex", confidence: 0.25, language: "python" },
  { name: "llama-index-core", framework: "llamaindex", confidence: 0.25, language: "python" },
  { name: "openai", framework: "openai-assistants", confidence: 0.15, language: "any" },
  { name: "anthropic", framework: "anthropic-claude", confidence: 0.15, language: "any" },
  { name: "claude-agent-sdk", framework: "anthropic-claude", confidence: 0.35, language: "python" },
  { name: "vertexai", framework: "google-vertex", confidence: 0.2, language: "python" },
  {
    name: "langchain-google-vertexai",
    framework: "google-vertex",
    confidence: 0.25,
    language: "python",
  },

  // JS/TS frameworks
  { name: "@langchain/core", framework: "langchain", confidence: 0.3, language: "typescript" },
  { name: "@langchain/openai", framework: "langchain", confidence: 0.3, language: "typescript" },
  { name: "@langchain/anthropic", framework: "langchain", confidence: 0.3, language: "typescript" },
  { name: "@langchain/community", framework: "langchain", confidence: 0.3, language: "typescript" },
  { name: "ai", framework: "vercel-ai", confidence: 0.2, language: "typescript" },
  { name: "@ai-sdk/openai", framework: "vercel-ai", confidence: 0.25, language: "typescript" },
  { name: "@ai-sdk/anthropic", framework: "vercel-ai", confidence: 0.25, language: "typescript" },
  { name: "@ai-sdk/google", framework: "vercel-ai", confidence: 0.25, language: "typescript" },
];

/**
 * Environment variable patterns that indicate AI agent usage
 */
export const ENV_VAR_PATTERNS: Array<{ pattern: RegExp; provider: string; confidence: number }> = [
  { pattern: /OPENAI_API_KEY\s*=/, provider: "openai", confidence: 0.1 },
  { pattern: /ANTHROPIC_API_KEY\s*=/, provider: "anthropic", confidence: 0.1 },
  { pattern: /AZURE_OPENAI_API_KEY\s*=/, provider: "azure-openai", confidence: 0.1 },
  { pattern: /AZURE_OPENAI_ENDPOINT\s*=/, provider: "azure-openai", confidence: 0.1 },
  { pattern: /GOOGLE_API_KEY\s*=/, provider: "google", confidence: 0.05 },
  { pattern: /GEMINI_API_KEY\s*=/, provider: "google", confidence: 0.1 },
  { pattern: /AWS_BEDROCK/, provider: "aws-bedrock", confidence: 0.1 },
  { pattern: /HUGGINGFACE_API_KEY\s*=/, provider: "huggingface", confidence: 0.05 },
  { pattern: /COHERE_API_KEY\s*=/, provider: "cohere", confidence: 0.05 },
  { pattern: /OPENROUTER_API_KEY\s*=/, provider: "openrouter", confidence: 0.1 },
];
