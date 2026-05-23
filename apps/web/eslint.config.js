import { nextJsConfig } from "@formforge/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  { ignores: ["**/dist/**", "**/.next/**", "**/node_modules/**", "env.js"] },
  ...nextJsConfig,
  {
    languageOptions: { globals: { process: "readonly", globalThis: "readonly" } },
    rules: {
      "react/prop-types": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { varsIgnorePattern: "^_" }],
    },
  },
];
