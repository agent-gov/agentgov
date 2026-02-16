import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/scanner",
  "packages/reporter",
  "packages/cli",
]);
