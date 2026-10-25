"use client";

import type { ReactNode } from "react";
import { ChevronRightIcon } from "@healthalyst/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@healthalyst/ui/primitives/dialog";
import { cn } from "@healthalyst/ui/lib/utilities";

type LauncherApplication = {
  key: string;
  name: string;
  description: string;
  /**
   * A decorative image that fills the card, such as a Next.js `Image` with
   * `fill`. It is hidden from assistive technology; the name carries meaning.
   */
  image: ReactNode;
  /** Opens the application; leave empty when it cannot be opened yet. */
  href?: string;
  /** Whether the person has this application; others appear muted. */
  available: boolean;
  /** Why an application cannot be opened, such as "Coming soon". */
  unavailableLabel?: string;
};

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
        <ul className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:grid-cols-3">
          {applications.map((application) => {
            const canOpen = application.available && Boolean(application.href);
            const content = (
              <>
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-0 [&_img]:object-cover [&_img]:transition-transform [&_img]:duration-300 motion-reduce:[&_img]:transition-none",
                    canOpen && "group-hover:[&_img]:scale-105",
                    !application.available && "grayscale"
                  )}
                >
                  {application.image}
                </span>
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/35 to-transparent"
                />
                {!canOpen && application.unavailableLabel && (
                  <span className="absolute right-3 top-3 rounded-md bg-background/90 px-2 py-1 text-xs font-medium text-foreground">
                    {application.unavailableLabel}
                  </span>
                )}
                <span className="relative mt-auto flex items-end justify-between gap-3 p-4">
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-base font-semibold text-background">
                      {application.name}
                    </span>
                    <span className="text-xs font-light leading-5 text-background/85">
                      {application.description}
                    </span>
                  </span>
                  {canOpen && (
                    <ChevronRightIcon
                      aria-hidden="true"
                      className="size-5 shrink-0 text-background transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                    />
                  )}
                </span>
              </>
            );
            const cardClassName =
              "relative flex aspect-square flex-col overflow-hidden rounded-xl bg-muted";

            return (
              <li key={application.key}>
                {canOpen ? (
                  <a
                    href={application.href}
                    className={cn(
                      cardClassName,
                      "group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    )}
                  >
                    {content}
                  </a>
                ) : (
                  <div
                    aria-disabled="true"
                    className={cn(
                      cardClassName,
                      !application.available && "opacity-60"
                    )}
                  >
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

export type { ApplicationLauncherDialogProperties, LauncherApplication };
