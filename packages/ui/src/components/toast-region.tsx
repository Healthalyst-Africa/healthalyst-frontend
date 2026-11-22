"use client";

import { toast } from "sonner";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { Toaster } from "@healthalyst/ui/primitives/sonner";

/**
 * Where short messages appear, at the bottom right. Render it once per app.
 * Use toasts only for brief news such as "Calendar saved" or a light offer;
 * page, step and panel states use `StateNotice`, and inline guidance uses
 * `NoticeBanner`.
 */
export function ToastRegion() {
  return <Toaster position="bottom-right" closeButton />;
}

/** Confirms a completed action, such as "Calendar saved". */
export function announceSuccess(message: string, description?: string) {
  toast.success(message, description ? { description } : undefined);
}

type ChoiceOffer = {
  /** Keeps the offer from appearing twice. */
  identifier: string;
  title: string;
  description: string;
  acceptLabel: string;
  onAccept: () => void;
  declineLabel: string;
  onDecline: () => void;
};

/**
 * An optional offer with two answers, such as a first-time tour. It stays
 * until one is chosen, and returns a way to withdraw it unanswered.
 */
export function offerChoice({
  identifier,
  title,
  description,
  acceptLabel,
  onAccept,
  declineLabel,
  onDecline,
}: ChoiceOffer): () => void {
  toast.custom(
    (toastIdentifier) => (
      <div className="w-[var(--width)] max-w-full rounded-lg border bg-background p-4 text-foreground shadow-lg">
        <p className="text-sm font-medium leading-5">{title}</p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          {description}
        </p>
        <div className="mt-3 flex justify-end gap-2">
          <ActionButton
            type="button"
            size="compact"
            variant="ghost"
            onClick={() => {
              toast.dismiss(toastIdentifier);
              onDecline();
            }}
          >
            {declineLabel}
          </ActionButton>
          <ActionButton
            type="button"
            size="compact"
            onClick={() => {
              toast.dismiss(toastIdentifier);
              onAccept();
            }}
          >
            {acceptLabel}
          </ActionButton>
        </div>
      </div>
    ),
    { id: identifier, duration: Number.POSITIVE_INFINITY, dismissible: false }
  );
  return () => toast.dismiss(identifier);
}
