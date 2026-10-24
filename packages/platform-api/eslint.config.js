import baseConfiguration from "@healthalyst/eslint-config/base";

const BROWSER_IMPORT_RESTRICTIONS = [
  {
    group: ["**/server", "**/server/**", "node:*", "ioredis"],
    message:
      "Browser modules cannot import the server session implementation or Node.js dependencies.",
  },
  {
    group: [
      "**/components/**",
      "**/hooks/**",
      "**/apps/**",
      "@healthalyst/organization",
      "@healthalyst/health-schedule",
      "@healthalyst/super-admin",
    ],
    message:
      "Platform transport must remain independent of application rendering and workflow hooks.",
  },
];

export default [
  ...baseConfiguration,
  {
    files: ["src/{authentication,browser,config}/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: BROWSER_IMPORT_RESTRICTIONS,
        },
      ],
    },
  },
  {
    files: [
      "src/{authentication,browser}/**/{config,schemas,types}/**/*.ts",
      "src/config/**/*.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...BROWSER_IMPORT_RESTRICTIONS,
            {
              group: ["**/services/**"],
              message:
                "Configuration, schemas and types cannot depend on request services.",
            },
          ],
        },
      ],
    },
  },
];
