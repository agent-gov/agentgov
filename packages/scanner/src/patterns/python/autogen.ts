import type { FrameworkPatterns } from "../../types/index.js";

export const autogenPatterns: FrameworkPatterns = {
  framework: "autogen",
  displayName: "AutoGen / AG2",
  languages: ["python"],
  imports: [
    {
      pattern: /from\s+autogen\s+import/,
      type: "import",
      confidence: 0.3,
      description: "AutoGen import",
    },
    {
      pattern: /import\s+autogen/,
      type: "import",
      confidence: 0.3,
      description: "AutoGen module import",
    },
    {
      pattern: /from\s+pyautogen/,
      type: "import",
      confidence: 0.3,
      description: "PyAutoGen import",
    },
    {
      pattern: /from\s+ag2\s+import/,
      type: "import",
      confidence: 0.3,
      description: "AG2 import",
    },
    {
      pattern: /import\s+ag2/,
      type: "import",
      confidence: 0.3,
      description: "AG2 module import",
    },
    {
      pattern: /from\s+autogen_agentchat/,
      type: "import",
      confidence: 0.3,
      description: "AutoGen AgentChat import",
    },
  ],
  instantiations: [
    {
      pattern: /AssistantAgent\s*\(/,
      type: "instantiation",
      confidence: 0.3,
      description: "AutoGen AssistantAgent",
    },
    {
      pattern: /UserProxyAgent\s*\(/,
      type: "instantiation",
      confidence: 0.3,
      description: "AutoGen UserProxyAgent",
    },
    {
      pattern: /ConversableAgent\s*\(/,
      type: "instantiation",
      confidence: 0.3,
      description: "AutoGen ConversableAgent",
    },
    {
      pattern: /GroupChat\s*\(/,
      type: "instantiation",
      confidence: 0.25,
      description: "AutoGen GroupChat",
    },
  ],
  dependencies: ["autogen", "pyautogen", "ag2", "autogen-agentchat"],
};
