export type FormOption = {
  value: string;
  label: string;
  /** A shorter label for places with little room, such as a chosen chip. */
  selectedLabel?: string;
};

type FormFieldBase = {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  columnSpan?: 1 | 2;
  hideLabel?: boolean;
  borderless?: boolean;
};

export type FormFieldDefinition =
  | (FormFieldBase & {
      kind: "text" | "email" | "password" | "tel" | "url" | "textarea";
      autoComplete?: string;
      placeholder?: string;
      minLength?: number;
      maxLength?: number;
      rows?: number;
    })
  | (FormFieldBase & {
      kind: "select";
      placeholder: string;
      options: readonly FormOption[];
    })
  | (FormFieldBase & {
      /** One box submitted as `value` (default "on") when checked, such as a consent. */
      kind: "checkbox";
      value?: string;
    })
  | (FormFieldBase & {
      /** A dropdown of several choices; each chosen option submits its value. */
      kind: "multi-select";
      placeholder: string;
      options: readonly FormOption[];
      maximumSelections?: number;
    })
  | (FormFieldBase & {
      /** Several boxes sharing `name`; each checked option submits its value. */
      kind: "checkbox-group";
      options: readonly FormOption[];
    });

export type FormSectionDefinition = {
  identifier: string;
  title?: string;
  description?: string;
  columns?: 1 | 2;
  separated?: boolean;
  fields: readonly FormFieldDefinition[];
};

export type FormDefinition = {
  identifier: string;
  sections: readonly FormSectionDefinition[];
};
