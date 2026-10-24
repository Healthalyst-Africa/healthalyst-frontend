import type { FormDefinition } from "../types/form-definition";

/** Every field name a definition renders, in display order. */
export function formDefinitionFieldNames(definition: FormDefinition): string[] {
  return definition.sections.flatMap((section) =>
    section.fields.map((field) => field.name)
  );
}
