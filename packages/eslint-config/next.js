import { globalIgnores } from "eslint/config";
import nextPlugin from "@next/eslint-plugin-next";
import prettier from "eslint-config-prettier/flat";
import reactHooks from "eslint-plugin-react-hooks";
import {
  APPLICATION_RESTRICTIONS,
  createArchitectureConfiguration,
} from "./architecture.js";
import baseConfiguration from "./base.js";

const nextConfiguration = [
  ...baseConfiguration,
  ...createArchitectureConfiguration({
    restrictions: APPLICATION_RESTRICTIONS,
  }),
  {
    plugins: { "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  reactHooks.configs.flat.recommended,
  {
    settings: { react: { version: "detect" } },
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/static-components": "off",
    },
  },
  prettier,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
];

export default nextConfiguration;
