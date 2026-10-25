"use client";

import type { ReactNode } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@healthalyst/ui/primitives/dialog";
import { ActionFailedIllustration } from "@healthalyst/ui/illustrations/action-failed-illustration";
import { AttentionNeededIllustration } from "@healthalyst/ui/illustrations/attention-needed-illustration";
import { DocumentsCompleteIllustration } from "@healthalyst/ui/illustrations/documents-complete-illustration";

type FeedbackDialogTone = "success" | "error" | "warning" | "information";

const DEFAULT_ILLUSTRATIONS: Record<FeedbackDialogTone, ReactNode> = {
  success: <DocumentsCompleteIllustration />,
  error: <ActionFailedIllustration />,
  warning: <AttentionNeededIllustration />,
  information: undefined,
};

type FeedbackDialogAction = {
  label: string;
  onSelect: () => void;
  isLoading?: boolean;
  loadingText?: string;
};

type FeedbackDialogProperties = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `success` confirms, `error` reports a failure, `warning` asks for care. */
  tone: FeedbackDialogTone;
  title: string;
  description: ReactNode;
  /** The main next step; defaults to closing the dialog. */
  primaryAction?: FeedbackDialogAction;
  /** An optional alternative, such as "Close" beside "Try again". */
  secondaryAction?: FeedbackDialogAction;
  /** Replaces the tone's illustration, from `@healthalyst/ui/illustrations/*`. */
  illustration?: ReactNode;
};

/**
 * A focused confirmation of the outcome of an important action, such as a
 * submitted application or a failed payment, with an illustration for its tone.
 */
export function FeedbackDialog({
  open,
  onOpenChange,
  tone,
  title,
  description,
  primaryAction,
  secondaryAction,
  illustration,
}: FeedbackDialogProperties) {
  const shownIllustration = illustration ?? DEFAULT_ILLUSTRATIONS[tone];
  const closeDialog = () => onOpenChange(false);
  const mainAction = primaryAction ?? { label: "Close", onSelect: closeDialog };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md gap-6 rounded-2xl px-6 pb-6 pt-8 sm:rounded-2xl"
        role={tone === "error" ? "alertdialog" : "dialog"}
      >
        <DialogHeader className="items-center gap-2 text-center sm:text-center">
          {shownIllustration && (
            <div
              aria-hidden="true"
              className="mb-2 w-20 [&_svg]:h-auto [&_svg]:w-full"
            >
              {shownIllustration}
            </div>
          )}
          <DialogTitle className="font-serif text-2xl font-normal leading-tight tracking-normal">
            {title}
          </DialogTitle>
          <DialogDescription className="max-w-sm leading-6">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-3 sm:justify-center sm:space-x-0">
          {secondaryAction && (
            <ActionButton
              type="button"
              variant="outline"
              isLoading={secondaryAction.isLoading}
              loadingText={secondaryAction.loadingText}
              onClick={secondaryAction.onSelect}
            >
              {secondaryAction.label}
            </ActionButton>
          )}
          <ActionButton
            type="button"
            variant={tone === "error" ? "destructive" : "default"}
            isLoading={mainAction.isLoading}
            loadingText={mainAction.loadingText}
            onClick={mainAction.onSelect}
          >
            {mainAction.label}
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type {
  FeedbackDialogAction,
  FeedbackDialogProperties,
  FeedbackDialogTone,
};
