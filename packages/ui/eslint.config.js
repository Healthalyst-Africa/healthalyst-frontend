import {
  IMPORT_RESTRICTIONS,
  PACKAGE_RESTRICTIONS,
  createArchitectureConfiguration,
} from "@healthalyst/eslint-config/architecture";
import baseConfiguration from "@healthalyst/eslint-config/base";

// Only ActionButton composes the button primitive; the primitives themselves
// may reference it, as shadcn generates them.
export default [
  ...baseConfiguration,
  ...createArchitectureConfiguration({
    restrictions: [
      ...PACKAGE_RESTRICTIONS,
      IMPORT_RESTRICTIONS.buttonPrimitive,
    ],
  }),
  ...createArchitectureConfiguration({
    restrictions: PACKAGE_RESTRICTIONS,
    sourceFiles: [
      "src/components/action-button.tsx",
      "src/primitives/**/*.{ts,tsx}",
    ],
    contractFiles: [],
  }),
];
