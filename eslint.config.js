import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/coverage/**",
      "packages/scanner/tests/fixtures/**",
    ],
  },
  {
    rules: {
      // Allow unused variables prefixed with _
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Allow explicit any in a few places (CLI opts parsing, etc.)
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
);
