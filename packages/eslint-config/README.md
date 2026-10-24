# ESLint configuration

Shared flat configurations for general JavaScript/TypeScript packages and Next.js applications. Extend the preset that matches each package instead of copying its rules.

Both presets include `architecture.js`: applications cannot import another app,
and configuration, schemas and types cannot import rendering, workflow hooks or
request services. The Platform package also protects its browser/server imports
in its own configuration. See [code organisation](../../docs/code-organization.md).
