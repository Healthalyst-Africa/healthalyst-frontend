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

type FormDialogProperties = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  /** The form's fields. */
  children: ReactNode;
  submitLabel: string;
  submittingLabel?: string;
  isSubmitting?: boolean;
  /** `destructive` colours the submit button for irreversible actions. */
  tone?: "default" | "destructive";
  /** A form-level error, such as a failed request. */
  error?: string;
  onSubmit: (formEvent: FormEvent<HTMLFormElement>) => void;
};

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
  submittingLabel,
  isSubmitting = false,
  tone = "default",
  error,
  onSubmit,
}: FormDialogProperties) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 rounded-2xl p-0 sm:rounded-2xl">
        <form onSubmit={onSubmit} noValidate className="flex flex-col">
          <DialogHeader className="gap-1 px-6 pb-2 pt-7 text-left sm:text-left">
            <DialogTitle className="font-serif text-2xl font-normal leading-tight tracking-normal">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="leading-6">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="flex flex-col gap-5 px-6 py-5">
            {children}
            {error && <FormMessage tone="error">{error}</FormMessage>}
          </div>
          <DialogFooter className="gap-3 border-t px-6 py-4 sm:space-x-0">
            <ActionButton
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
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
