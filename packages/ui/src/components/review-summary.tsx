"use client";

import type { MouseEvent, ReactNode } from "react";
import {
  ChevronDownIcon,
  DocumentIcon,
  SuccessIcon,
  WarningIcon,
} from "@healthalyst/icons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@healthalyst/ui/primitives/accordion";
import {
  FileStatusText,
  FileTile,
} from "@healthalyst/ui/components/file-display/file-display";
import { cn } from "@healthalyst/ui/lib/utilities";
import type { StatusTone } from "@healthalyst/ui/types/status-tone";

/** A link to the place where something can be changed or finished. */
type ReviewLink = {
  label: string;
  href: string;
  /** Runs instead of following `href`, for in-page navigation. */
  onSelect?: () => void;
};

function selectLink(
  reviewLink: ReviewLink,
  clickEvent: MouseEvent<HTMLAnchorElement>
) {
  if (!reviewLink.onSelect) return;
  clickEvent.preventDefault();
  reviewLink.onSelect();
}

const LINK_FOCUS_CLASS_NAME =
  "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/* ------------------------------------------------------------------------ */

type ReviewSection = {
  value: string;
  heading: string;
  /** A one-line digest shown under the heading. */
  summary: string;
  complete: boolean;
  /** A descriptive link shown below the section's content, such as "Edit organisation details". */
  action?: ReviewLink;
  children: ReactNode;
};

/**
 * Reviewed parts of a workflow as expandable rows. Incomplete sections start
 * open so their gaps are visible; complete ones start collapsed. Each row's
 * trigger is a level-three heading.
 */
export function ReviewSections({
  sections,
}: {
  sections: readonly ReviewSection[];
}) {
  return (
    <Accordion
      type="multiple"
      defaultValue={sections
        .filter((section) => !section.complete)
        .map((section) => section.value)}
      className="flex flex-col gap-3"
    >
      {sections.map((section) => {
        // Matches the completed-step mark in OnboardingProgress.
        const CompletionIcon = section.complete ? SuccessIcon : WarningIcon;
        return (
          <AccordionItem
            key={section.value}
            value={section.value}
            className="rounded-xl border bg-card"
          >
            <AccordionTrigger
              showIndicator={false}
              className="group min-w-0 gap-4 rounded-xl px-4 py-4 hover:no-underline sm:px-5"
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full",
                  section.complete
                    ? "bg-secondary text-status-positive"
                    : "bg-alert-warning-surface text-status-warning"
                )}
              >
                <CompletionIcon aria-hidden="true" className="size-5" />
                <span className="sr-only">
                  {section.complete ? "Complete:" : "Needs attention:"}
                </span>
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-base font-medium leading-6 text-foreground">
                  {section.heading}
                </span>
                <span className="text-xs font-light leading-5 text-muted-foreground sm:truncate">
                  {section.summary}
                </span>
              </span>
              <ChevronDownIcon
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
              />
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 px-4 pb-5 sm:px-5 sm:pl-[4.25rem]">
              {section.children}
              {section.action && (
                <a
                  href={section.action.href}
                  onClick={(clickEvent) =>
                    section.action && selectLink(section.action, clickEvent)
                  }
                  className={cn(
                    "inline-flex min-h-8 w-fit items-center text-sm font-semibold text-primary underline underline-offset-4 hover:no-underline",
                    LINK_FOCUS_CLASS_NAME
                  )}
                >
                  {section.action.label}
                </a>
              )}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

/* ------------------------------------------------------------------------ */

type SummaryDetail = { label: string; value?: string | null };

/** Labelled values, such as the details entered in a form. */
export function SummaryDetailList({
  details,
  emptyValueLabel = "Not provided",
}: {
  details: readonly SummaryDetail[];
  emptyValueLabel?: string;
}) {
  return (
    <dl className="grid gap-x-8 gap-y-4 rounded-lg bg-secondary/50 px-4 py-4 sm:grid-cols-2">
      {details.map((detail) => (
        <div key={detail.label} className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">{detail.label}</dt>
          <dd
            className={cn(
              "text-sm [overflow-wrap:anywhere]",
              !detail.value && "text-muted-foreground"
            )}
          >
            {detail.value || emptyValueLabel}
          </dd>
        </div>
      ))}
    </dl>
  );
}

type SummaryTile = {
  key: string;
  title: string;
  description?: string;
  /** Shown only when it adds information, such as "Active". */
  status?: { label: string; tone: StatusTone };
};

/** Short named items side by side, such as the products an organisation chose. */
export function SummaryTiles({ tiles }: { tiles: readonly SummaryTile[] }) {
  return (
    <ul className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
      {tiles.map((tile) => (
        <li
          key={tile.key}
          className="flex min-w-0 flex-col gap-1 rounded-lg bg-secondary/50 px-4 py-3"
        >
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">{tile.title}</span>
            {tile.status && (
              <span className="text-xs">
                <FileStatusText
                  label={tile.status.label}
                  tone={tile.status.tone}
                />
              </span>
            )}
          </span>
          {tile.description && (
            <span className="text-xs font-light leading-5 text-muted-foreground">
              {tile.description}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

type SummaryCheck = { key: string; label: string; complete: boolean };

/** Checks shown side by side, each marked complete or not. */
export function SummaryChecks({ checks }: { checks: readonly SummaryCheck[] }) {
  return (
    <ul className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
      {checks.map((check) => {
        const CheckIcon = check.complete ? SuccessIcon : WarningIcon;
        return (
          <li
            key={check.key}
            className={cn(
              "flex items-start gap-2 rounded-lg px-3 py-3 text-sm",
              check.complete ? "bg-secondary/50" : "bg-alert-warning-surface"
            )}
          >
            <CheckIcon
              aria-hidden="true"
              className={cn(
                "mt-0.5 size-4 shrink-0",
                check.complete ? "text-status-positive" : "text-status-warning"
              )}
            />
            <span>
              <span className="sr-only">
                {check.complete ? "Complete: " : "Not complete: "}
              </span>
              {check.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

type SummaryFile = {
  key: string;
  label: string;
  /** The added file, or nothing when the item is still missing. */
  file?: {
    fileTypeLabel?: string;
    previewUrl?: string;
    status?: { label: string; tone: StatusTone };
  };
  /** Where a missing item can be added. */
  addLink?: ReviewLink;
};

/** Files grouped by purpose, with missing ones shown as places to add them. */
export function SummaryFiles({ files }: { files: readonly SummaryFile[] }) {
  return (
    <ul className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
      {files.map((summaryFile) => (
        <li
          key={summaryFile.key}
          className={cn(
            "flex min-w-0 items-center gap-3 rounded-lg px-3 py-3",
            summaryFile.file ? "bg-secondary/50" : "bg-alert-warning-surface"
          )}
        >
          {summaryFile.file ? (
            <FileTile
              className="size-12 border-transparent bg-background"
              previewUrl={summaryFile.file.previewUrl}
              fileTypeLabel={summaryFile.file.fileTypeLabel}
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-12 shrink-0 items-center justify-center rounded-md bg-background text-status-warning"
            >
              <DocumentIcon className="size-5" />
            </span>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-sm font-medium leading-5">{summaryFile.label}</p>
            {summaryFile.file ? (
              <>
                {summaryFile.file.status && (
                  <span className="text-xs">
                    <FileStatusText
                      label={summaryFile.file.status.label}
                      tone={summaryFile.file.status.tone}
                    />
                  </span>
                )}
              </>
            ) : summaryFile.addLink ? (
              <a
                href={summaryFile.addLink.href}
                onClick={(clickEvent) =>
                  summaryFile.addLink &&
                  selectLink(summaryFile.addLink, clickEvent)
                }
                className={cn(
                  "w-fit text-xs font-semibold text-primary underline-offset-4 hover:underline",
                  LINK_FOCUS_CLASS_NAME
                )}
              >
                {summaryFile.addLink.label}
              </a>
            ) : (
              <p className="text-xs text-muted-foreground">Not added</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export type {
  ReviewLink,
  ReviewSection,
  SummaryCheck,
  SummaryDetail,
  SummaryFile,
};
