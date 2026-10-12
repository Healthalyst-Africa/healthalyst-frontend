import javascriptConfiguration from "@eslint/js";
import prettierConfiguration from "eslint-config-prettier/flat";
import turboPlugin from "eslint-plugin-turbo";
import typescriptConfiguration from "typescript-eslint";
import { globalIgnores } from "eslint/config";

const baseConfiguration = [
  javascriptConfiguration.configs.recommended,
  ...typescriptConfiguration.configs.recommended,
  {
    plugins: { turbo: turboPlugin },
    rules: { "turbo/no-undeclared-env-vars": "warn" },
  },
  prettierConfiguration,
  globalIgnores(["**/dist/**", "**/.next/**", "**/out/**", "**/.turbo/**"]),
];

export default baseConfiguration;
