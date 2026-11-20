import { useRef } from "react";

type FocusHandler = (focusEvent: Event) => void;

/**
 * Returns focus to whatever opened a dialog or sheet when it closes.
 *
 * Radix returns focus only to its own trigger element. Dialogs opened from
 * code, such as from a menu item or a table row, have none, so focus would
 * fall back to the top of the page and keyboard users would lose their
 * place. This remembers the element that had focus as the dialog opened.
 */
export function useReturnFocus({
  onOpenAutoFocus,
  onCloseAutoFocus,
}: {
  onOpenAutoFocus?: FocusHandler;
  onCloseAutoFocus?: FocusHandler;
}): { onOpenAutoFocus: FocusHandler; onCloseAutoFocus: FocusHandler } {
  const openerReference = useRef<HTMLElement | null>(null);

  return {
    onOpenAutoFocus: (focusEvent) => {
      const focusedElement = document.activeElement;
      openerReference.current =
        focusedElement instanceof HTMLElement &&
        focusedElement !== document.body
          ? focusedElement
          : null;
      onOpenAutoFocus?.(focusEvent);
    },
    onCloseAutoFocus: (focusEvent) => {
      onCloseAutoFocus?.(focusEvent);
      if (focusEvent.defaultPrevented) return;
      const opener = openerReference.current;
      openerReference.current = null;
      // An opener that has since left the page, such as a removed row,
      // leaves focus to Radix.
      if (opener?.isConnected) {
        focusEvent.preventDefault();
        opener.focus({ preventScroll: true });
      }
    },
  };
}
