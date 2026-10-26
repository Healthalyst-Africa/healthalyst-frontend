import { registrationSteps } from "~/features/organization-registration/config/organization-registration-form-definition";

/** The first step holding one of `errors`, or `undefined` when none does. */
export function findFirstStepIndexWithErrors(
  errors: Readonly<Record<string, string>>
): number | undefined {
  const stepIndex = registrationSteps.findIndex((step) =>
    step.fieldNames.some((fieldName) => Boolean(errors[fieldName]))
  );
  return stepIndex === -1 ? undefined : stepIndex;
}
