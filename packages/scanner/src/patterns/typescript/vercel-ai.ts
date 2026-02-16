import type { FrameworkPatterns } from "../../types/index.js";

export const vercelAiPatterns: FrameworkPatterns = {
  framework: "vercel-ai",
  displayName: "Vercel AI SDK",
  languages: ["typescript", "javascript"],
  imports: [
    {
      pattern: /from\s+["']ai["']/,
      type: "import",
      confidence: 0.25,
      description: "Vercel AI SDK import",
    },
    {
      pattern: /from\s+["']@ai-sdk\//,
      type: "import",
      confidence: 0.3,
      description: "Vercel AI SDK scoped import",
    },
  ],
  instantiations: [
    {
      pattern: /generateText\s*\(/,
      type: "instantiation",
      confidence: 0.2,
      description: "Vercel AI SDK generateText",
    },
    {
      pattern: /streamText\s*\(/,
      type: "instantiation",
      confidence: 0.2,
      description: "Vercel AI SDK streamText",
    },
    {
      pattern: /\btool\s*\(\s*\{/,
      type: "instantiation",
      confidence: 0.2,
      description: "Vercel AI SDK tool definition",
    },
  ],
  dependencies: ["ai", "@ai-sdk/openai", "@ai-sdk/anthropic", "@ai-sdk/google"],
};

export const openaiSdkJsPatterns: FrameworkPatterns = {
  framework: "openai-assistants",
  displayName: "OpenAI SDK",
  languages: ["typescript", "javascript"],
  imports: [
    {
      pattern: /from\s+["']openai["']/,
      type: "import",
      confidence: 0.2,
      description: "OpenAI SDK import",
    },
    {
      pattern: /require\s*\(\s*["']openai["']\s*\)/,
      type: "import",
      confidence: 0.2,
      description: "OpenAI SDK require",
    },
  ],
  instantiations: [
    {
      pattern: /new\s+OpenAI\s*\(/,
      type: "instantiation",
      confidence: 0.15,
      description: "OpenAI client instantiation",
    },
    {
      pattern: /chat\.completions\.create/,
      type: "instantiation",
      confidence: 0.15,
      description: "OpenAI chat completions",
    },
    {
      pattern: /\.beta\.assistants/,
      type: "instantiation",
      confidence: 0.3,
      description: "OpenAI Assistants API",
    },
    {
      pattern: /tools\s*:\s*\[/,
      type: "code_pattern",
      confidence: 0.1,
      description: "Tool definitions array",
    },
  ],
  dependencies: ["openai"],
};
