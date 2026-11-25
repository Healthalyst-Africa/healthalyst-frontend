import { Badge } from "@healthalyst/ui/primitives/badge";
import { cn } from "@healthalyst/ui/lib/utilities";
import type {
  StatusPresentation,
  StatusTone,
} from "@healthalyst/ui/types/status-tone";

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

/**
 * The one tag component: a short outlined status with an icon that stands
 * for it, such as a siren for "Emergency". Pass a tag defined once in the
 * owning feature as `{ label, tone, icon }`; pages never compose tags.
 */
export function StatusLabel({
  label,
  tone,
  icon: Icon,
  className,
}: StatusPresentation & { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        // A fixed height with tight line height centres the icon and words
        // on the same line, whatever the font's spacing above and below.
        "h-6 items-center gap-1 whitespace-nowrap rounded-full bg-transparent px-2.5 py-0 text-xs font-medium leading-none",
        STATUS_PRESENTATION[tone],
        className
      )}
    >
      <Icon aria-hidden="true" className="block size-3.5 shrink-0" />
      <span className="leading-none">{label}</span>
    </Badge>
  );
}
