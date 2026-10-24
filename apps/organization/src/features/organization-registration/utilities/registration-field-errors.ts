const registrationFieldDependencies: Record<string, string[]> = {
  password: ["confirmPassword"],
};

export function clearRegistrationFieldErrors(
  errors: Record<string, string>,
  fieldName: string
): Record<string, string> {
  const updatedErrors = { ...errors };
  delete updatedErrors[fieldName];
  for (const dependentFieldName of registrationFieldDependencies[fieldName] ??
    []) {
    delete updatedErrors[dependentFieldName];
  }
  return updatedErrors;
}
