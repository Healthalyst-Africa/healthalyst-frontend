import type { ReactNode } from "react";
import {
  FileStatusText,
  FileTile,
} from "@healthalyst/ui/components/file-display/file-display";
import type { StatusTone } from "@healthalyst/ui/types/status-tone";
import { cn } from "@healthalyst/ui/lib/utilities";

type FileActionListItem = {
  key: string;
  /** What the file is, such as "CAC certificate". */
  title: string;
  /** Supporting facts, such as the file name and size. */
  details?: string;
  fileTypeLabel?: string;
  status?: { label: string; tone: StatusTone };
  /** An action for the file, such as a "View document" button. */
  action?: ReactNode;
};

/** Files with their status and an action each, on subtle backgrounds. */
/** One file row (a 48 px tile with padding) and the gap after it. */
const FILE_ROW_HEIGHT_REM = 4.5 + 0.5;

export function FileActionList({
  items,
  maximumVisibleItems,
}: {
  items: readonly FileActionListItem[];
  /** Beyond this many files, the list scrolls inside its own box. */
  maximumVisibleItems?: number;
}) {
  const scrolls =
    maximumVisibleItems !== undefined && items.length > maximumVisibleItems;
  return (
    <ul
      className={cn(
        "flex flex-col gap-2",
        scrolls && "overflow-y-auto overscroll-contain pr-1"
      )}
      style={
        scrolls && maximumVisibleItems !== undefined
          ? {
              maxHeight: `${(maximumVisibleItems + 0.5) * FILE_ROW_HEIGHT_REM}rem`,
            }
          : undefined
      }
    >
      {items.map((item) => (
        <li
          key={item.key}
          className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-3"
        >
          <FileTile
            className="size-12 border-transparent bg-background"
            fileTypeLabel={item.fileTypeLabel}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-sm font-medium leading-5">{item.title}</p>
            {item.details && (
              <p className="truncate text-xs text-muted-foreground">
                {item.details}
              </p>
            )}
            {item.status && (
              <span className="text-xs">
                <FileStatusText
                  label={item.status.label}
                  tone={item.status.tone}
                />
              </span>
            )}
          </div>
          {item.action && <div className="shrink-0">{item.action}</div>}
        </li>
      ))}
    </ul>
  );
}

export type { FileActionListItem };
