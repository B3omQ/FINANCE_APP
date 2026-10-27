import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import boundaries from "eslint-plugin-boundaries";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    ignores: ["dist/**", "src-tauri/**", "node_modules/**"],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooks,
      boundaries: boundaries,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
      },
      "boundaries/elements": [
        { type: "app", pattern: "src/app/**", partialMatch: false },
        { type: "features", pattern: "src/features/*/**", capture: ["feature"], partialMatch: false },
        { type: "domain", pattern: "src/domain/**", partialMatch: false },
        { type: "data", pattern: "src/data/**", partialMatch: false },
        { type: "shared", pattern: "src/shared/**", partialMatch: false },
        { type: "store", pattern: "src/store/**", partialMatch: false },
      ],
      "boundaries/ignore": ["src/**/*.{test,spec}.{ts,tsx}", "src/test-setup.ts"],
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            {
              from: { element: { type: "app" } },
              allow: [{ to: { element: { type: ["features", "domain", "data", "shared", "store"] } } }],
            },
            {
              from: { element: { type: "features" } },
              allow: [
                { to: { element: { type: "features", captured: { feature: "{{from.captured.feature}}" } } } },
                { to: { element: { type: ["domain", "data", "shared", "store"] } } },
              ],
            },
            {
              from: { element: { type: "data" } },
              allow: [{ to: { element: { type: ["domain", "shared"] } } }],
            },
            {
              from: { element: { type: "domain" } },
              allow: [{ to: { element: { type: "domain" } } }],
            },
            {
              from: { element: { type: "store" } },
              allow: [{ to: { element: { type: ["shared", "domain"] } } }],
            },
            {
              from: { element: { type: "shared" } },
              allow: [{ to: { element: { type: "shared" } } }],
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react-dom", "@tauri-apps/*"],
              message: "domain/ must be pure TypeScript and not depend on React or Tauri.",
            },
          ],
        },
      ],
    },
  },
  prettierConfig,
];
