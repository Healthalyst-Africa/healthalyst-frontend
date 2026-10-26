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
