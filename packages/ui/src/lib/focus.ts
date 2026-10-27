import type { FocusEvent } from "react";

/**
 * Whether focus moved outside the element handling the event, rather than to
 * another control inside it, such as a field's "Show password" button.
 */
export function isFocusLeaving(focusEvent: FocusEvent<HTMLElement>): boolean {
  const nextFocus = focusEvent.relatedTarget;
  return !(
    nextFocus instanceof Node && focusEvent.currentTarget.contains(nextFocus)
  );
}
