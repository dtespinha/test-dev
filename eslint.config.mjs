import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.js", "**/*.cjs", "**/*.mjs", "**/*.ts"],
    ignores: [".next/**", "node_modules/**"],
    rules: {
      indent: ["error", 2],
      quotes: ["error", "double"],
      semi: ["error", "always"],
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-trailing-spaces": "error",
      "comma-dangle": ["error", "always-multiline"],
      "no-unused-vars": "warn",
      "no-console": "warn",
      "prefer-const": "error",
      "arrow-spacing": ["error", { before: true, after: true }],
      "object-curly-spacing": ["error", "always"],
      "no-constant-binary-expression": "error",
    },
  },
]);
