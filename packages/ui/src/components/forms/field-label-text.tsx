"use client";

/**
 * A field's label text, followed by an asterisk when the field is required.
 * Controls with a native `required` state already announce it, so the
 * asterisk stays visual for them; others pass `announceRequired` to have
 * "required" read with their label.
 */
export function FieldLabelText({
  label,
  required = false,
  announceRequired = false,
}: {
  label: string;
  required?: boolean;
  announceRequired?: boolean;
}) {
  return (
    <span>
      {label}
      {required && (
        <>
          <span aria-hidden="true" className="ml-0.5 text-destructive">
            *
          </span>
          {announceRequired && <span className="sr-only"> (required)</span>}
        </>
      )}
    </span>
  );
}
