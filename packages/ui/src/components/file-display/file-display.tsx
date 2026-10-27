import {
  DocumentIcon,
  ErrorIcon,
  InformationIcon,
  LoaderIcon,
  SuccessIcon,
  WarningIcon,
} from "@healthalyst/icons";
import { cn } from "@healthalyst/ui/lib/utilities";
import type { StatusTone } from "@healthalyst/ui/types/status-tone";

const FILE_STATUS_PRESENTATION: Record<
  StatusTone,
  { className: string; icon: typeof SuccessIcon }
> = {
  neutral: { className: "text-muted-foreground", icon: InformationIcon },
  information: { className: "text-status-information", icon: LoaderIcon },
  warning: { className: "text-status-warning", icon: WarningIcon },
  highlight: { className: "text-status-highlight", icon: InformationIcon },
  positive: { className: "text-status-positive", icon: SuccessIcon },
  negative: { className: "text-status-negative", icon: ErrorIcon },
};

/** A file's thumbnail, or its type when no preview is available. */
export function FileTile({
  previewUrl,
  fileTypeLabel,
  className,
}: {
  previewUrl?: string;
  fileTypeLabel?: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-16 shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-md border bg-secondary text-primary",
        className
      )}
    >
      {previewUrl ? (
        // An uploaded file's own preview; it is never optimised or cached.
        <img src={previewUrl} alt="" className="size-full object-cover" />
      ) : (
        <>
          <DocumentIcon className="size-6" />
          {fileTypeLabel && (
            <span className="text-[0.625rem] font-semibold leading-none tracking-wide">
              {fileTypeLabel}
            </span>
          )}
        </>
      )}
    </span>
  );
}

/** A small status icon and label, such as "Uploaded" or "Rejected". */
/** Characters kept visible before a file's extension when its name is cut short. */
const VISIBLE_NAME_ENDING_LENGTH = 7;

/**
 * A file name on one line. A long name is shortened in the middle, so its
 * ending and extension stay visible; the full name remains in the text.
 */
export function FileName({
  fileName,
  className,
}: {
  fileName: string;
  className?: string;
}) {
  const extensionStart = fileName.lastIndexOf(".");
  const endingStart = Math.max(
    0,
    (extensionStart > 0 ? extensionStart : fileName.length) -
      VISIBLE_NAME_ENDING_LENGTH
  );
  const beginning = fileName.slice(0, endingStart);
  const ending = fileName.slice(endingStart);

  return (
    <span className={cn("flex min-w-0", className)} title={fileName}>
      <span className="truncate">{beginning}</span>
      <span className="shrink-0">{ending}</span>
    </span>
  );
}

export function FileStatusText({
  label,
  tone,
}: {
  label: string;
  tone: StatusTone;
}) {
  const presentation = FILE_STATUS_PRESENTATION[tone];
  const StatusIcon = presentation.icon;
  return (
    <span
      className={cn("inline-flex items-center gap-1", presentation.className)}
    >
      <StatusIcon
        aria-hidden="true"
        className={cn(
          "size-3.5 shrink-0",
          tone === "information" && "animate-spin motion-reduce:animate-none"
        )}
      />
      {label}
    </span>
  );
}
