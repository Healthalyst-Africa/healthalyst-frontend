import type { ReactNode } from "react";
import { FieldLabelText } from "@healthalyst/ui/components/forms/field-label-text";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldTitle,
} from "@healthalyst/ui/primitives/field";

type LabelledControlGroupProperties = {
  id: string;
  title: string;
  /** A live message describing the control's current state. */
  message?: ReactNode;
  /** `error` announces the message immediately; `status` announces it politely. */
  messageTone?: "status" | "error";
  /** Marks the group's title with an asterisk and announces it as required. */
  required?: boolean;
  children?: ReactNode;
};

/**
 * Groups a custom or third-party control, such as an embedded challenge,
 * with a title and a live state message.
 */
export function LabelledControlGroup({
  id,
  title,
  message,
  messageTone = "status",
  required = false,
  children,
}: LabelledControlGroupProperties) {
  const titleIdentifier = `${id}-title`;
  const messageIdentifier = `${id}-message`;

  return (
    <Field
      role="group"
      aria-labelledby={titleIdentifier}
      aria-describedby={message ? messageIdentifier : undefined}
    >
      <FieldTitle id={titleIdentifier}>
        <FieldLabelText label={title} required={required} announceRequired />
      </FieldTitle>
      {children}
      {message &&
        (messageTone === "error" && !children ? (
          <FieldError id={messageIdentifier}>{message}</FieldError>
        ) : (
          <FieldDescription
            id={messageIdentifier}
            role={messageTone === "error" ? "alert" : "status"}
            aria-live={messageTone === "error" ? "assertive" : "polite"}
          >
            {message}
          </FieldDescription>
        ))}
    </Field>
  );
}
