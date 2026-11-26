import {
  IMPORT_RESTRICTIONS,
  createArchitectureConfiguration,
} from "@healthalyst/eslint-config/architecture";
import baseConfiguration from "@healthalyst/eslint-config/base";

// This package is the only place allowed to import the icon vendor.
export default [
  ...baseConfiguration,
  ...createArchitectureConfiguration({
    restrictions: [IMPORT_RESTRICTIONS.applicationIsolation],
  }),
];
