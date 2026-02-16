/**
 * Git Blame Enricher
 *
 * Extracts ownership and modification history from git blame data.
 * Used to determine who owns each detected agent and when it was last modified.
 *
 * Graceful degradation: if the scanned directory is not a git repo (or git
 * is not installed), enrichment is silently skipped — the scanner still works,
 * it just won't have owner/date metadata.
 */

import { simpleGit } from "simple-git";
import type { AgentRecord } from "../types/index.js";

export interface GitBlameResult {
  /** Most frequent author (primary owner) */
  owner: string | undefined;
  /** Last modification date */
  lastModified: Date | undefined;
  /** All unique authors who modified the file */
  authors: string[];
}

/**
 * Check if a directory is inside a git repository
 */
export async function isGitRepo(scanPath: string): Promise<boolean> {
  try {
    const git = simpleGit(scanPath);
    await git.revparse(["--is-inside-work-tree"]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get git blame info for a specific file.
 * Returns the primary owner (most commits) and last modification date.
 */
export async function getFileBlame(scanPath: string, filePath: string): Promise<GitBlameResult> {
  const empty: GitBlameResult = {
    owner: undefined,
    lastModified: undefined,
    authors: [],
  };

  try {
    const git = simpleGit(scanPath);

    // Get git log for this specific file — more reliable than raw blame parsing
    const log = await git.log({
      file: filePath,
      maxCount: 50, // Last 50 commits for this file
      format: {
        author_name: "%aN",
        date: "%aI",
      },
    });

    if (!log.all || log.all.length === 0) {
      return empty;
    }

    // Count commits per author to find primary owner
    const authorCounts = new Map<string, number>();
    for (const entry of log.all) {
      const author = (entry as unknown as { author_name: string }).author_name;
      if (author) {
        authorCounts.set(author, (authorCounts.get(author) ?? 0) + 1);
      }
    }

    // Primary owner = author with most commits to this file
    let owner: string | undefined;
    let maxCount = 0;
    for (const [author, count] of authorCounts) {
      if (count > maxCount) {
        maxCount = count;
        owner = author;
      }
    }

    // Last modification date = most recent commit
    const lastEntry = log.latest;
    const lastModified = lastEntry?.date ? new Date(lastEntry.date) : undefined;

    // Unique authors
    const authors = Array.from(authorCounts.keys());

    return { owner, lastModified, authors };
  } catch {
    // Git command failed — file might not be tracked, or not a git repo
    return empty;
  }
}

/**
 * Enrich an array of agent records with git blame data.
 * Processes files in batch to minimize git operations.
 */
export async function enrichWithGitBlame(agents: AgentRecord[], scanPath: string): Promise<void> {
  // Check if we're in a git repo first — skip everything if not
  const inRepo = await isGitRepo(scanPath);
  if (!inRepo) return;

  // Cache blame results by file path (multiple agents may share a file)
  const blameCache = new Map<string, GitBlameResult>();

  for (const agent of agents) {
    const filePath = agent.location.filePath;

    if (!blameCache.has(filePath)) {
      const blame = await getFileBlame(scanPath, filePath);
      blameCache.set(filePath, blame);
    }

    const blame = blameCache.get(filePath)!;
    agent.metadata.owner = blame.owner;
    agent.metadata.lastModified = blame.lastModified;
  }
}
