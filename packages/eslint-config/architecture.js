const APPLICATION_IMPORT_RESTRICTION = {
  group: [
    "**/apps/**",
    "@healthalyst/organization",
    "@healthalyst/health-schedule",
    "@healthalyst/super-admin",
  ],
  message:
    "Applications are independent. Import a shared package instead of another application.",
};

const architectureConfiguration = [
  {
    files: ["**/src/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [APPLICATION_IMPORT_RESTRICTION],
        },
      ],
    },
  },
  {
    files: ["**/src/**/{config,schemas,types}/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            APPLICATION_IMPORT_RESTRICTION,
            {
              group: [
                "**/components/**",
                "**/hooks/**",
                "**/services/**",
                "**/api/*service*",
              ],
              message:
                "Configuration, schemas and types must not depend on rendering, workflow hooks or request services.",
            },
          ],
        },
      ],
    },
  },
];

export default architectureConfiguration;
