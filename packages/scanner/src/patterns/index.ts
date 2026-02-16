import type { FrameworkPatterns, Language } from "../types/index.js";

// Python patterns
import {
  langchainPatterns,
  langgraphPatterns,
  crewaiPatterns,
  autogenPatterns,
  semanticKernelPatterns,
  haystackPatterns,
  llamaindexPatterns,
  openaiAssistantsPatterns,
  anthropicPatterns,
  awsBedrockPatterns,
  googleVertexPatterns,
} from "./python/index.js";

// TypeScript patterns
import { langchainJsPatterns, vercelAiPatterns, openaiSdkJsPatterns } from "./typescript/index.js";

// Config patterns
export { DEPENDENCY_MAPPINGS, ENV_VAR_PATTERNS } from "./config/index.js";

/**
 * All registered framework patterns.
 * The pattern registry is the heart of the detection engine.
 */
export const ALL_PATTERNS: FrameworkPatterns[] = [
  // Python
  langchainPatterns,
  langgraphPatterns,
  crewaiPatterns,
  autogenPatterns,
  semanticKernelPatterns,
  haystackPatterns,
  llamaindexPatterns,
  openaiAssistantsPatterns,
  anthropicPatterns,
  awsBedrockPatterns,
  googleVertexPatterns,
  // TypeScript / JavaScript
  langchainJsPatterns,
  vercelAiPatterns,
  openaiSdkJsPatterns,
];

/**
 * Get patterns filtered by language
 */
export function getPatternsForLanguage(language: Language): FrameworkPatterns[] {
  return ALL_PATTERNS.filter((p) => p.languages.includes(language));
}

/**
 * Get all known config file names that indicate agent usage
 */
export function getAgentConfigFileNames(): string[] {
  const names: string[] = [];
  for (const p of ALL_PATTERNS) {
    if (p.configFiles) {
      names.push(...p.configFiles);
    }
  }
  // Add generic agent config files
  names.push("agents.yaml", "agents.yml", "agent.json", "agent_config.json", "agent_config.yaml");
  return [...new Set(names)];
}

/**
 * File extensions mapped to languages
 */
export const LANGUAGE_EXTENSIONS: Record<string, Language> = {
  ".py": "python",
  ".pyw": "python",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".js": "javascript",
  ".jsx": "javascript",
  ".mjs": "javascript",
  ".cjs": "javascript",
};

/**
 * Files to check for dependency declarations
 */
export const DEPENDENCY_FILES = [
  "requirements.txt",
  "pyproject.toml",
  "setup.py",
  "setup.cfg",
  "Pipfile",
  "package.json",
];

/**
 * Directories to always skip
 */
export const SKIP_DIRECTORIES = [
  "node_modules",
  "__pycache__",
  ".git",
  ".svn",
  ".hg",
  "dist",
  "build",
  ".next",
  ".nuxt",
  "venv",
  ".venv",
  "env",
  ".env",
  ".tox",
  ".mypy_cache",
  ".pytest_cache",
  "coverage",
  ".coverage",
  "htmlcov",
  ".eggs",
  "*.egg-info",
  ".terraform",
];

/**
 * Maximum file size to scan (1MB)
 */
export const MAX_FILE_SIZE = 1_000_000;
