import type {
  FormDefinition,
  FormFieldDefinition,
} from "../types/form-definition";

/** Every field name a definition renders, in display order. */
export function formDefinitionFieldNames(definition: FormDefinition): string[] {
  return definition.sections.flatMap((section) =>
    section.fields.map((field) => field.name)
  );
}

/**
 * The definition with the field called `fieldName` replaced, for fields whose
 * choices or state are only known while the form is open.
 */
export function replaceFormField<Definition extends FormDefinition>(
  definition: Definition,
  fieldName: string,
  replacement: FormFieldDefinition
): Definition {
  return {
    ...definition,
    sections: definition.sections.map((section) => ({
      ...section,
      fields: section.fields.map((field) =>
        field.name === fieldName ? replacement : field
      ),
    })),
  };
}
