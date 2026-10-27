import type { ReactNode } from "react";
import { ChevronRightIcon } from "@healthalyst/icons";
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
  /** A decorative icon for that reason, such as a clock or a lock. */
  unavailableIcon?: ReactNode;
};

type ApplicationLauncherGridProperties = {
  applications: readonly LauncherApplication[];
};

/**
 * Applications to continue into, as a grid of image cards. Applications the
 * person has open when chosen; the rest are muted and say why.
 */
export function ApplicationLauncherGrid({
  applications,
}: ApplicationLauncherGridProperties) {
  return (
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
                // Anything that cannot be opened yet is shown in greyscale.
                !canOpen && "grayscale"
              )}
            >
              {application.image}
            </span>
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/35 to-transparent"
            />
            {!canOpen && application.unavailableLabel && (
              <>
                {/* Always announced; shown on hover for pointer users. */}
                <span className="sr-only">{application.unavailableLabel}</span>
                <span
                  aria-hidden="true"
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-foreground/60 opacity-0 backdrop-blur-[3px] transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none"
                >
                  {application.unavailableIcon && (
                    <span className="flex size-10 items-center justify-center rounded-full bg-background/15 text-background ring-1 ring-background/35 sm:size-12 [&_svg]:size-5">
                      {application.unavailableIcon}
                    </span>
                  )}
                  <span className="px-3 text-center font-serif text-heading text-background">
                    {application.unavailableLabel}
                  </span>
                </span>
              </>
            )}
            <span
              className={cn(
                "relative mt-auto flex items-end justify-between gap-3 p-4 transition-opacity duration-300 motion-reduce:transition-none",
                // Let the reason stand alone while it is shown.
                !canOpen &&
                  application.unavailableLabel &&
                  "group-hover:opacity-0"
              )}
            >
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
              <div aria-disabled="true" className={cn(cardClassName, "group")}>
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export type { ApplicationLauncherGridProperties, LauncherApplication };
