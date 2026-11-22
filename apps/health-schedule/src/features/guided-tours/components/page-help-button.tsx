"use client";

import { useState } from "react";
import { PageGuideDialog } from "@healthalyst/ui/components/page-guide-dialog";
import { usePageHelp } from "~/features/guided-tours/hooks/use-page-help";

const HELP_BUTTON_SELECTOR = '[data-tour="page-help"]';

/** Finds the help button, so a tour can hand focus back to it. */
export function findHelpButton(): HTMLElement | null {
  return document.querySelector<HTMLElement>(HELP_BUTTON_SELECTOR);
}

/**
 * The header's question-mark icon: what this page is for, and a tour where
 * the page has one. It opens only when pressed.
 */
export function PageHelpButton() {
  const { guide, tourName, startPageTour } = usePageHelp();
  const [isOpen, setIsOpen] = useState(false);

  if (!guide) return null;

  return (
    <PageGuideDialog
      triggerAttributes={{ "data-tour": "page-help" }}
      open={isOpen}
      onOpenChange={setIsOpen}
      title={guide.title}
      paragraphs={guide.paragraphs}
      tourAction={
        tourName
          ? {
              label: "Show me around",
              onSelect: () => {
                setIsOpen(false);
                // Start once the dialog has closed and returned focus.
                window.setTimeout(
                  () => void startPageTour({ returnFocusTo: findHelpButton }),
                  0
                );
              },
            }
          : undefined
      }
    />
  );
}
