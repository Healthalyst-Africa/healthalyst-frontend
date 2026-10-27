"use client";

import { SuccessIcon } from "@healthalyst/icons";
import { cn } from "@healthalyst/ui/lib/utilities";

/** Live feedback about a field's value that is not an error. */
export type FieldStatus = {
  tone: "neutral" | "success";
  message: string;
};

/**
 * Feedback shown under a field while someone types, such as how many more
 * characters a password needs or that two passwords match. Success is read
 * out politely; neutral progress stays quiet so every keystroke is not
 * announced.
 */
export function FieldStatusMessage({
  identifier,
  status,
}: {
  identifier: string;
  status: FieldStatus;
}) {
  const isSuccess = status.tone === "success";

  return (
    <p
      id={identifier}
      data-slot="field-status"
      aria-live={isSuccess ? "polite" : "off"}
      className={cn(
        "flex items-center gap-1 text-caption",
        isSuccess ? "text-primary" : "text-muted-foreground"
      )}
    >
      {isSuccess && (
        <SuccessIcon aria-hidden="true" className="size-3.5 shrink-0" />
      )}
      {status.message}
    </p>
  );
}
