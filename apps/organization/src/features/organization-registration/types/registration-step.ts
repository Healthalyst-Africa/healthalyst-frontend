import type { FormDefinition } from "@healthalyst/ui/types/form-definition";

export type PlatformRegistrationStep = {
  identifier: string;
  heading: string;
  description?: string;
  /** Says what the step's main button does, including the next step's name. */
  actionLabel: string;
  definitions: readonly FormDefinition[];
  fieldNames: readonly string[];
};

/** What receives focus once a newly shown step has rendered. */
export type PendingStepFocus =
  | { kind: "step-heading" }
  | { kind: "invalid-field"; errors: Record<string, string> };
