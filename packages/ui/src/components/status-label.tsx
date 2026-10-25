import { Badge } from "@healthalyst/ui/primitives/badge";
import { cn } from "@healthalyst/ui/lib/utilities";
import type { StatusTone } from "@healthalyst/ui/types/status-tone";

/** A softened version of the text colour, so the label leads. */
const SOFTENED_BORDER =
  "border-[color-mix(in_srgb,currentColor_40%,transparent)]";

/** Text and border colour for each status tone. */
const STATUS_PRESENTATION: Record<StatusTone, string> = {
  neutral: cn("text-status-neutral", SOFTENED_BORDER),
  information: cn("text-status-information", SOFTENED_BORDER),
  warning: cn("text-status-warning", SOFTENED_BORDER),
  // Brand gold is too light for text on white, but suits the border.
  highlight: "text-status-highlight border-gold",
  positive: cn("text-status-positive", SOFTENED_BORDER),
  negative: cn("text-status-negative", SOFTENED_BORDER),
};

/** A short outlined status, such as "Active", "Required" or "Rejected". */
export function StatusLabel({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap rounded-full bg-transparent px-2.5 py-0.5 text-xs font-medium",
        STATUS_PRESENTATION[tone],
        className
      )}
    >
      {children}
    </Badge>
  );
}
