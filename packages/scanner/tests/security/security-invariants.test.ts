/**
 * Security Invariants Test Suite
 *
 * This file is the SINGLE SOURCE OF TRUTH for AgentGov's security properties.
 * Every security invariant must have a test here. When adding new security
 * behavior, add a corresponding describe("S{N}: ...") block.
 *
 * Invariants:
 *   S1  API key values are never stored in scan output
 *   S2  Evidence matched text is capped at 200 characters
 *   S3  Dependency evidence text is capped at 200 characters
 *   S4  All user-controlled strings in HTML output are XSS-escaped
 *   S5  .env files are in .gitignore
 *   S6  process.env is only accessed for GITHUB_TOKEN (with safe fallback)
 *   S7  No secrets patterns appear in committed source code
 *   S8  No source file outputs raw environment variable values
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { scanLocal } from "../../src/scanners/local.js";

// ─── Paths ──────────────────────────────────────────────────────────────────
const REPO_ROOT = resolve(__dirname, "../../../..");
const PACKAGES_DIR = join(REPO_ROOT, "packages");
const FIXTURES_DIR = resolve(__dirname, "../fixtures");

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Recursively collect all .ts source files in packages/,
 * excluding node_modules, dist, tests, fixtures, and config files.
 */
function collectSourceFiles(dir: string): string[] {
  const results: string[] = [];
  function walk(d: string) {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) {
        if (["node_modules", "dist", "tests", "fixtures", ".git"].includes(entry.name)) continue;
        walk(full);
      } else if (
        entry.name.endsWith(".ts") &&
        !entry.name.endsWith(".config.ts") &&
        !entry.name.endsWith(".test.ts")
      ) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// S1: API Key Redaction
// ═══════════════════════════════════════════════════════════════════════════

describe("S1: API key values are never stored in evidence", () => {
  it("should redact all env_var evidence matchedText", async () => {
    const result = await scanLocal({ path: FIXTURES_DIR });
    for (const agent of result.agents) {
      for (const evidence of agent.evidence) {
        if (evidence.type === "env_var") {
          expect(evidence.matchedText).toContain("redacted");
        }
      }
    }
  });

  it("should never contain real OpenAI key patterns in evidence", async () => {
    const result = await scanLocal({ path: FIXTURES_DIR });
    for (const agent of result.agents) {
      for (const evidence of agent.evidence) {
        expect(evidence.matchedText).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);
      }
    }
  });

  it("should never contain real Anthropic key patterns in evidence", async () => {
    const result = await scanLocal({ path: FIXTURES_DIR });
    for (const agent of result.agents) {
      for (const evidence of agent.evidence) {
        expect(evidence.matchedText).not.toMatch(/sk-ant-[a-zA-Z0-9]{20,}/);
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// S2: Evidence Truncation
// ═══════════════════════════════════════════════════════════════════════════

describe("S2: Evidence matched text is capped at 200 characters", () => {
  it("should never produce evidence exceeding 203 chars (200 + '...')", async () => {
    const result = await scanLocal({ path: FIXTURES_DIR });
    for (const agent of result.agents) {
      for (const evidence of agent.evidence) {
        expect(evidence.matchedText.length).toBeLessThanOrEqual(203);
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// S3: Dependency Evidence Truncation
// ═══════════════════════════════════════════════════════════════════════════

describe("S3: Dependency evidence text is capped at 200 characters", () => {
  it("should have .slice(0, 200) in local scanner for dependency evidence", () => {
    const localScannerSrc = readFileSync(
      join(PACKAGES_DIR, "scanner/src/scanners/local.ts"),
      "utf-8",
    );
    expect(localScannerSrc).toContain(".slice(0, 200)");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// S4: XSS Escaping in HTML Output
// ═══════════════════════════════════════════════════════════════════════════

describe("S4: XSS escaping in HTML output", () => {
  it("should have an escapeHtml function that handles &, <, >, and quotes", () => {
    const htmlSrc = readFileSync(join(PACKAGES_DIR, "reporter/src/formatters/html.ts"), "utf-8");
    expect(htmlSrc).toContain("function escapeHtml");
    expect(htmlSrc).toContain("&amp;");
    expect(htmlSrc).toContain("&lt;");
    expect(htmlSrc).toContain("&gt;");
    expect(htmlSrc).toContain("&quot;");
  });

  it("should apply escapeHtml to agent.name", () => {
    const htmlSrc = readFileSync(join(PACKAGES_DIR, "reporter/src/formatters/html.ts"), "utf-8");
    expect(htmlSrc).toContain("escapeHtml(agent.name)");
  });

  it("should apply escapeHtml to agent.framework", () => {
    const htmlSrc = readFileSync(join(PACKAGES_DIR, "reporter/src/formatters/html.ts"), "utf-8");
    expect(htmlSrc).toContain("escapeHtml(agent.framework)");
  });

  it("should apply escapeHtml to agent.location.filePath", () => {
    const htmlSrc = readFileSync(join(PACKAGES_DIR, "reporter/src/formatters/html.ts"), "utf-8");
    expect(htmlSrc).toContain("escapeHtml(agent.location.filePath)");
  });

  it("should apply escapeHtml to agent.metadata.language", () => {
    const htmlSrc = readFileSync(join(PACKAGES_DIR, "reporter/src/formatters/html.ts"), "utf-8");
    expect(htmlSrc).toContain("escapeHtml(agent.metadata.language)");
  });

  it("should apply escapeHtml to result.summary.scanPath", () => {
    const htmlSrc = readFileSync(join(PACKAGES_DIR, "reporter/src/formatters/html.ts"), "utf-8");
    expect(htmlSrc).toContain("escapeHtml(result.summary.scanPath)");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// S5: .env in .gitignore
// ═══════════════════════════════════════════════════════════════════════════

describe("S5: .env files are gitignored", () => {
  it("should have .env in .gitignore", () => {
    const gitignore = readFileSync(join(REPO_ROOT, ".gitignore"), "utf-8");
    expect(gitignore).toContain(".env");
  });

  it("should have .env.local in .gitignore", () => {
    const gitignore = readFileSync(join(REPO_ROOT, ".gitignore"), "utf-8");
    expect(gitignore).toContain(".env.local");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// S6: Controlled process.env Access
// ═══════════════════════════════════════════════════════════════════════════

describe("S6: process.env is only used for GITHUB_TOKEN with safe fallback", () => {
  it("should only access process.env.GITHUB_TOKEN in source code", () => {
    const sourceFiles = collectSourceFiles(PACKAGES_DIR);
    const violations: string[] = [];

    for (const file of sourceFiles) {
      const content = readFileSync(file, "utf-8");
      const envMatches = content.matchAll(/process\.env\.(\w+)/g);
      for (const match of envMatches) {
        if (match[1] !== "GITHUB_TOKEN") {
          violations.push(`${relative(REPO_ROOT, file)}: unexpected process.env.${match[1]}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("should have a safe fallback (empty string) for GITHUB_TOKEN", () => {
    const auditSrc = readFileSync(join(PACKAGES_DIR, "cli/src/commands/audit.ts"), "utf-8");
    expect(auditSrc).toMatch(/process\.env\.GITHUB_TOKEN\s*\?\?\s*""/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// S7: No Secrets in Source Code
// ═══════════════════════════════════════════════════════════════════════════

describe("S7: No secrets patterns in committed source code", () => {
  const SECRET_PATTERNS = [
    { name: "OpenAI API key", pattern: /sk-[a-zA-Z0-9]{20,}/ },
    { name: "Anthropic API key", pattern: /sk-ant-[a-zA-Z0-9]{20,}/ },
    { name: "AWS access key", pattern: /AKIA[0-9A-Z]{16}/ },
    {
      name: "Private key block",
      pattern: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/,
    },
    {
      name: "High-entropy hardcoded secret",
      pattern: /(?:secret|password|token|key)\s*[:=]\s*["'][A-Za-z0-9+/]{32,}["']/i,
    },
  ];

  it("should not contain hardcoded secrets in any source file", () => {
    const sourceFiles = collectSourceFiles(PACKAGES_DIR);
    const violations: string[] = [];

    for (const file of sourceFiles) {
      const content = readFileSync(file, "utf-8");
      for (const { name, pattern } of SECRET_PATTERNS) {
        if (pattern.test(content)) {
          violations.push(`${relative(REPO_ROOT, file)}: potential ${name}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// S8: No Raw Environment Variable Output
// ═══════════════════════════════════════════════════════════════════════════

describe("S8: Source code never outputs raw environment variable values", () => {
  it("should never console.log/write/stringify process.env values directly", () => {
    const sourceFiles = collectSourceFiles(PACKAGES_DIR);
    const violations: string[] = [];

    const dangerousPatterns = [
      { name: "console output of env", pattern: /console\.\w+\(.*process\.env/ },
      { name: "file write of env", pattern: /writeFile.*process\.env/ },
      { name: "JSON stringify of env", pattern: /JSON\.stringify\(.*process\.env/ },
    ];

    for (const file of sourceFiles) {
      const content = readFileSync(file, "utf-8");
      for (const { name, pattern } of dangerousPatterns) {
        if (pattern.test(content)) {
          violations.push(`${relative(REPO_ROOT, file)}: ${name}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
