import type { FormFieldDefinition } from "@healthalyst/ui/types/form-definition";
import { LOCAL_GOVERNMENT_AREA_FIELD_TEXT } from "~/shared/organization/config/local-government-areas";
import type { LocalGovernmentAreaChoice } from "~/shared/organization/hooks/use-local-government-area-choice";

/** The local government area dropdown, with the chosen state's areas. */
export function createLocalGovernmentAreaField({
  name,
  choice,
  columnSpan,
}: {
  name: string;
  choice: LocalGovernmentAreaChoice;
  columnSpan?: 1 | 2;
}): FormFieldDefinition {
  return {
    kind: "select",
    name,
    label: LOCAL_GOVERNMENT_AREA_FIELD_TEXT.label,
    placeholder: choice.placeholder,
    options: choice.options,
    disabled: choice.unavailable,
    required: false,
    columnSpan,
  };
}
