// Import rules that keep the architecture in AGENTS.md true. ESLint replaces a
// rule's options when a later configuration matches the same file, so every
// configuration lists its complete set of restrictions.

export const IMPORT_RESTRICTIONS = {
  applicationIsolation: {
    group: [
      "**/apps/**",
      "@healthalyst/organization",
      "@healthalyst/health-schedule",
      "@healthalyst/super-admin",
    ],
    message:
      "Applications are independent. Import a shared package instead of another application.",
  },
  iconVendors: {
    group: [
      "@tabler/icons-react",
      "@tabler/icons-react/*",
      "lucide-react",
      "lucide-react/*",
      "react-icons",
      "react-icons/*",
      "@heroicons/*",
    ],
    message:
      "Import icons from @healthalyst/icons. It owns the icon vendor and exports each icon under a semantic name.",
  },
  sharedPrimitives: {
    group: ["@healthalyst/ui/primitives/*"],
    message:
      "Applications never use shadcn primitives directly. Compose a dedicated component in packages/ui/src/components and import it from @healthalyst/ui/components.",
  },
  buttonPrimitive: {
    group: ["@healthalyst/ui/primitives/button", "**/primitives/button"],
    message:
      "Use ActionButton from @healthalyst/ui/components/action-button. Only ActionButton may use the button primitive.",
  },
  contractLayers: {
    group: [
      "**/components/**",
      "**/hooks/**",
      "**/services/**",
      "**/api/*service*",
    ],
    message:
      "Configuration, schemas and types must not depend on rendering, workflow hooks or request services.",
  },
};

export const SOURCE_FILES = ["**/src/**/*.{ts,tsx,js,jsx}"];
export const CONTRACT_FILES = [
  "**/src/**/{config,schemas,types}/**/*.{ts,tsx}",
];

export const PACKAGE_RESTRICTIONS = [
  IMPORT_RESTRICTIONS.applicationIsolation,
  IMPORT_RESTRICTIONS.iconVendors,
];

export const APPLICATION_RESTRICTIONS = [
  ...PACKAGE_RESTRICTIONS,
  IMPORT_RESTRICTIONS.sharedPrimitives,
];

function restrictImports(patterns) {
  return { "no-restricted-imports": ["error", { patterns }] };
}

export function createArchitectureConfiguration({
  restrictions,
  sourceFiles = SOURCE_FILES,
  contractFiles = CONTRACT_FILES,
}) {
  const architectureConfiguration = [
    { files: sourceFiles, rules: restrictImports(restrictions) },
  ];
  if (contractFiles.length > 0) {
    architectureConfiguration.push({
      files: contractFiles,
      rules: restrictImports([
        ...restrictions,
        IMPORT_RESTRICTIONS.contractLayers,
      ]),
    });
  }
  return architectureConfiguration;
}

const architectureConfiguration = createArchitectureConfiguration({
  restrictions: PACKAGE_RESTRICTIONS,
});

export default architectureConfiguration;
