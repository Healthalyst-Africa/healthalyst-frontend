"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@healthalyst/ui/primitives/dialog";
import {
  ApplicationLauncherGrid,
  type LauncherApplication,
} from "@healthalyst/ui/components/application-launcher-grid";

type ApplicationLauncherDialogProperties = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  applications: readonly LauncherApplication[];
};

/**
 * A choice of applications to continue into, as a grid of image cards.
 * Applications the person has open when chosen; the rest are muted and say why.
 */
export function ApplicationLauncherDialog({
  open,
  onOpenChange,
  title,
  description,
  applications,
}: ApplicationLauncherDialogProperties) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-6 rounded-2xl px-6 pb-6 pt-8 sm:rounded-2xl sm:px-8 sm:pb-8">
        <DialogHeader className="gap-1 text-left sm:text-left">
          <DialogTitle className="font-serif text-2xl font-normal leading-tight tracking-normal">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="max-w-xl leading-6">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <ApplicationLauncherGrid applications={applications} />
      </DialogContent>
    </Dialog>
  );
}

export type { ApplicationLauncherDialogProperties, LauncherApplication };
