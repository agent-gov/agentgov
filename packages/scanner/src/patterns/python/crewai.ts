import type { FrameworkPatterns } from "../../types/index.js";

export const crewaiPatterns: FrameworkPatterns = {
  framework: "crewai",
  displayName: "CrewAI",
  languages: ["python"],
  imports: [
    {
      pattern: /from\s+crewai\s+import/,
      type: "import",
      confidence: 0.3,
      description: "CrewAI import",
    },
    {
      pattern: /import\s+crewai/,
      type: "import",
      confidence: 0.3,
      description: "CrewAI module import",
    },
    {
      pattern: /from\s+crewai_tools/,
      type: "import",
      confidence: 0.25,
      description: "CrewAI tools import",
    },
    {
      pattern: /from\s+crewai\.project\s+import/,
      type: "import",
      confidence: 0.3,
      description: "CrewAI project import",
    },
  ],
  instantiations: [
    {
      pattern: /Crew\s*\(/,
      type: "instantiation",
      confidence: 0.3,
      description: "CrewAI Crew instantiation",
    },
    {
      pattern: /@CrewBase/,
      type: "instantiation",
      confidence: 0.3,
      description: "CrewAI class decorator",
    },
    {
      pattern: /@agent\b/,
      type: "code_pattern",
      confidence: 0.15,
      description: "CrewAI agent decorator",
    },
    {
      pattern: /@task\b/,
      type: "code_pattern",
      confidence: 0.15,
      description: "CrewAI task decorator",
    },
  ],
  configFiles: ["crewai.yaml", "crewai.yml"],
  dependencies: ["crewai", "crewai-tools"],
};
