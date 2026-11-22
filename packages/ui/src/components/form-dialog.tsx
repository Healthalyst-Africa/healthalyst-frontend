"use client";

import type { FormEvent, ReactNode } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { FormMessage } from "@healthalyst/ui/components/form-message";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@healthalyst/ui/primitives/dialog";
import { cn } from "@healthalyst/ui/lib/utilities";

type FormDialogProperties = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  /** The form's fields. */
  children: ReactNode;
  submitLabel: string;
  /** The button that closes without submitting; "Cancel" unless that would be confusing. */
  dismissLabel?: string;
  submittingLabel?: string;
  isSubmitting?: boolean;
  /** `destructive` colours the submit button for irreversible actions. */
  tone?: "default" | "destructive";
  /** A form-level error, such as a failed request. */
  error?: string;
  /** `wide` fits a longer form laid out in two columns, such as a registration. */
  size?: "default" | "wide";
  onSubmit: (formEvent: FormEvent<HTMLFormElement>) => void;
};

const DIALOG_WIDTH_CLASS_NAMES = {
  default: "max-w-lg",
  wide: "max-w-3xl",
} as const;

/**
 * A dialog that collects a few fields and submits them, such as a decision
 * with a reason. Field errors belong on the fields; `error` covers the rest.
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitLabel,
  dismissLabel = "Cancel",
  submittingLabel,
  isSubmitting = false,
  tone = "default",
  error,
  size = "default",
  onSubmit,
}: FormDialogProperties) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* The title and buttons stay in view; only the fields scroll. */}
      <DialogContent
        className={cn(
          "flex flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:rounded-2xl",
          DIALOG_WIDTH_CLASS_NAMES[size]
        )}
      >
        <form
          onSubmit={onSubmit}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          <DialogHeader className="shrink-0 gap-1 border-b px-6 pb-4 pt-7 text-left sm:px-8 sm:text-left">
            <DialogTitle className="font-serif text-2xl font-normal leading-tight tracking-normal">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="leading-6">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-6 sm:px-8">
            {children}
            {error && <FormMessage tone="error">{error}</FormMessage>}
          </div>
          <DialogFooter className="shrink-0 gap-3 border-t px-6 py-4 sm:space-x-0 sm:px-8">
            <ActionButton
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              {dismissLabel}
            </ActionButton>
            <ActionButton
              type="submit"
              variant={tone === "destructive" ? "destructive" : "default"}
              isLoading={isSubmitting}
              loadingText={submittingLabel}
            >
              {submitLabel}
            </ActionButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export type { FormDialogProperties };
