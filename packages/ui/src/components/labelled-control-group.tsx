import type { ReactNode } from "react";
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
      <FieldTitle id={titleIdentifier}>{title}</FieldTitle>
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
