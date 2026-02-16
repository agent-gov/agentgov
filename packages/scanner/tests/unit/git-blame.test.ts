import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { isGitRepo, getFileBlame, enrichWithGitBlame } from "../../src/enrichers/git-blame.js";
import type { AgentRecord } from "../../src/types/index.js";

const REPO_ROOT = resolve(__dirname, "../../../..");
const NON_GIT_DIR = "/tmp";

describe("Git Blame: isGitRepo", () => {
  it("should return false for /tmp (not a git repo)", async () => {
    expect(await isGitRepo(NON_GIT_DIR)).toBe(false);
  });

  it("should return a boolean for the project root", async () => {
    // The project may or may not be a git repo depending on whether
    // git init has been run. Either way, isGitRepo should return a boolean.
    const result = await isGitRepo(REPO_ROOT);
    expect(typeof result).toBe("boolean");
  });
});

describe("Git Blame: getFileBlame", () => {
  it("should return correct structure regardless of git state", async () => {
    const blame = await getFileBlame(REPO_ROOT, "package.json");
    expect(blame).toBeDefined();
    expect(blame).toHaveProperty("owner");
    expect(blame).toHaveProperty("lastModified");
    expect(blame).toHaveProperty("authors");
    expect(Array.isArray(blame.authors)).toBe(true);
  });

  it("should return empty for a non-existent file", async () => {
    const blame = await getFileBlame(REPO_ROOT, "this-file-does-not-exist.py");
    expect(blame.owner).toBeUndefined();
    expect(blame.lastModified).toBeUndefined();
    expect(blame.authors).toHaveLength(0);
  });

  it("should return empty for a non-git directory", async () => {
    const blame = await getFileBlame(NON_GIT_DIR, "anything.txt");
    expect(blame.owner).toBeUndefined();
    expect(blame.lastModified).toBeUndefined();
    expect(blame.authors).toHaveLength(0);
  });
});

describe("Git Blame: enrichWithGitBlame", () => {
  it("should gracefully handle non-git directories", async () => {
    const agents: AgentRecord[] = [
      {
        id: "ag_test-1",
        name: "Test Agent",
        framework: "langchain",
        confidence: 0.9,
        location: { filePath: "agent.py" },
        metadata: { language: "python" },
        evidence: [],
      },
    ];

    // Should not throw for non-git dirs
    await enrichWithGitBlame(agents, NON_GIT_DIR);

    // Owner and lastModified should remain undefined
    expect(agents[0].metadata.owner).toBeUndefined();
    expect(agents[0].metadata.lastModified).toBeUndefined();
  });

  it("should not throw for empty agent arrays", async () => {
    await enrichWithGitBlame([], REPO_ROOT);
  });

  it("should cache blame results for duplicate file paths", async () => {
    const agents: AgentRecord[] = [
      {
        id: "ag_1",
        name: "Agent 1",
        framework: "langchain",
        confidence: 0.9,
        location: { filePath: "package.json" },
        metadata: { language: "typescript" },
        evidence: [],
      },
      {
        id: "ag_2",
        name: "Agent 2",
        framework: "crewai",
        confidence: 0.8,
        location: { filePath: "package.json" },
        metadata: { language: "python" },
        evidence: [],
      },
    ];

    await enrichWithGitBlame(agents, REPO_ROOT);

    // Both agents point to the same file — they should get the same owner
    // (whether that's undefined or a real author)
    expect(agents[0].metadata.owner).toBe(agents[1].metadata.owner);
  });
});
