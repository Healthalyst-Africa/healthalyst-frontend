"use client";

import { GuidedTourIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@healthalyst/ui/primitives/dialog";

type PageGuideDialogProperties = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The page's name, such as "Emergency access reviews". */
  title: string;
  /** A few short paragraphs on what the page shows and does. */
  paragraphs: readonly string[];
  /** Marks the question-mark icon, so a tour can point at it. */
  triggerAttributes?: Record<`data-${string}`, string>;
  /** Offered when the page also has a guided tour. */
  tourAction?: { label: string; onSelect: () => void };
};

/**
 * A small question-mark icon that opens what a page is for and how to use
 * it. The guide is a few short paragraphs, closed with one button. Closing
 * it returns focus to the icon.
 */
export function PageGuideDialog({
  open,
  onOpenChange,
  title,
  paragraphs,
  triggerAttributes,
  tourAction,
}: PageGuideDialogProperties) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <ActionButton
          {...triggerAttributes}
          type="button"
          variant="ghost"
          size="unstyled"
          aria-label={`About this page: ${title}`}
          title="About this page"
          className="size-8 rounded-full text-muted-foreground hover:bg-transparent hover:text-foreground [&_svg]:size-[18px]"
        >
          <GuidedTourIcon aria-hidden="true" />
        </ActionButton>
      </DialogTrigger>
      <DialogContent className="max-w-md gap-4 p-6">
        <DialogHeader className="pr-6 text-left sm:text-left">
          <DialogTitle className="font-serif text-lg font-normal leading-snug tracking-normal">
            {title}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription asChild>
          <div className="flex flex-col gap-3 text-sm leading-6">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </DialogDescription>
        <DialogFooter className="gap-2 pt-1 sm:space-x-0">
          {tourAction ? (
            <>
              <ActionButton
                type="button"
                variant="outline"
                size="small"
                onClick={() => onOpenChange(false)}
              >
                Close
              </ActionButton>
              <ActionButton
                type="button"
                size="small"
                onClick={tourAction.onSelect}
              >
                {tourAction.label}
              </ActionButton>
            </>
          ) : (
            <ActionButton
              type="button"
              size="small"
              onClick={() => onOpenChange(false)}
            >
              Got it
            </ActionButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
