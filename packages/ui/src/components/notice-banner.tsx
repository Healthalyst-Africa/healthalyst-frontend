import type { MouseEvent, ReactNode } from "react";
import {
  ErrorIcon,
  InformationIcon,
  SuccessIcon,
  WarningIcon,
} from "@healthalyst/icons";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@healthalyst/ui/primitives/alert";
import { ActionFailedIllustration } from "@healthalyst/ui/illustrations/action-failed-illustration";
import { AttentionNeededIllustration } from "@healthalyst/ui/illustrations/attention-needed-illustration";
import { DocumentsCompleteIllustration } from "@healthalyst/ui/illustrations/documents-complete-illustration";
import { EmptyReviewQueueIllustration } from "@healthalyst/ui/illustrations/empty-review-queue-illustration";
import { cn } from "@healthalyst/ui/lib/utilities";

type NoticeBannerTone =
  "neutral" | "information" | "success" | "warning" | "error";

const TONE_PRESENTATION = {
  neutral: { variant: "default", icon: undefined },
  information: { variant: "information", icon: InformationIcon },
  success: { variant: "success", icon: SuccessIcon },
  warning: { variant: "warning", icon: WarningIcon },
  error: { variant: "destructive", icon: ErrorIcon },
} as const;

function announcementRole(tone: NoticeBannerTone) {
  return tone === "error" || tone === "warning" ? "alert" : "status";
}

function NoticeContent({
  tone,
  title,
  children,
  isProminent,
}: {
  tone: NoticeBannerTone;
  title: ReactNode;
  children?: ReactNode;
  isProminent: boolean;
}) {
  return (
    <>
      <AlertTitle className={cn("mb-0", isProminent && "text-heading")}>
        {title}
      </AlertTitle>
      {children && (
        <AlertDescription
          className={cn(
            "flex flex-col items-start gap-3 text-caption [&_p]:leading-5",
            tone !== "error" && "text-muted-foreground",
            // Under the title on phones, in the same column.
            isProminent && "gap-4 max-sm:col-start-2"
          )}
        >
          {children}
        </AlertDescription>
      )}
    </>
  );
}

type NoticeBannerProperties = {
  /**
   * `information` explains, `success` confirms, `warning` asks for attention
   * and `error` reports a failure. `neutral` is a plain bordered notice.
   */
  tone?: NoticeBannerTone;
  title: ReactNode;
  children?: ReactNode;
  /** Replaces the tone's icon; decorative, so hide it from assistive technology. */
  icon?: ReactNode;
  /** A call to action shown on the right, or below the text on small screens. */
  action?: ReactNode;
  className?: string;
};

/**
 * An inline notice with a tone icon: guidance within a step, feedback about a
 * field or section, or a transient error such as a failed request.
 *
 * For the state of a whole page, step or panel, use `StateNotice`, which
 * always shows an illustration.
 */
export function NoticeBanner({
  tone = "neutral",
  title,
  children,
  icon,
  action,
  className,
}: NoticeBannerProperties) {
  const ToneIcon = TONE_PRESENTATION[tone].icon;
  const shownIcon =
    icon ?? (ToneIcon ? <ToneIcon aria-hidden="true" /> : undefined);
  const content = (
    <NoticeContent tone={tone} title={title} isProminent={false}>
      {children}
    </NoticeContent>
  );

  return (
    <Alert
      variant={TONE_PRESENTATION[tone].variant}
      role={announcementRole(tone)}
      className={cn("[&>svg]:size-4", className)}
    >
      {shownIcon}
      {action ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1">{content}</div>
          <div className="shrink-0">{action}</div>
        </div>
      ) : (
        content
      )}
    </Alert>
  );
}

type StateNoticeTone = Exclude<NoticeBannerTone, "neutral">;

const DEFAULT_STATE_ILLUSTRATIONS: Record<StateNoticeTone, ReactNode> = {
  information: <EmptyReviewQueueIllustration />,
  success: <DocumentsCompleteIllustration />,
  warning: <AttentionNeededIllustration />,
  error: <ActionFailedIllustration />,
};

type StateNoticeProperties = {
  tone: StateNoticeTone;
  title: ReactNode;
  children?: ReactNode;
  /**
   * Replaces the tone's default illustration, from
   * `@healthalyst/ui/illustrations/*`. Every state notice has one.
   */
  illustration?: ReactNode;
  /** A call to action shown on the right, or below the text on small screens. */
  action?: ReactNode;
  className?: string;
};

/**
 * The state of a whole page, step or panel, such as "Waiting for a reviewer"
 * or "All required documents are in". It is always prominent and always shows
 * an illustration, chosen from its tone unless one is given.
 */
export function StateNotice({
  tone,
  title,
  children,
  illustration,
  action,
  className,
}: StateNoticeProperties) {
  return (
    <Alert
      variant={TONE_PRESENTATION[tone].variant}
      role={announcementRole(tone)}
      className={cn(
        // Phones: the illustration spans the title and description, which sit
        // close together; links and actions follow in the same column.
        // The illustration always starts level with the title.
        "grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-xl px-4 py-4 sm:flex sm:flex-row sm:items-start sm:gap-5 sm:px-6 sm:py-5",
        className
      )}
    >
      {/* Illustrations sit on a white disc so they read on any tone. */}
      <div
        aria-hidden="true"
        className="w-11 shrink-0 self-start [--illustration-base:hsl(var(--background))] max-sm:row-span-2 sm:w-16 [&_svg]:h-auto [&_svg]:w-full"
      >
        {illustration ?? DEFAULT_STATE_ILLUSTRATIONS[tone]}
      </div>
      <div className="contents sm:flex sm:min-w-0 sm:flex-1 sm:flex-col">
        <NoticeContent tone={tone} title={title} isProminent>
          {children}
        </NoticeContent>
      </div>
      {action && (
        <div className="shrink-0 max-sm:col-start-2 max-sm:mt-3 sm:self-center">
          {action}
        </div>
      )}
    </Alert>
  );
}

type NoticeBannerLink = {
  key: string;
  label: string;
  href: string;
  /** Runs instead of following `href`, for in-page navigation. */
  onSelect?: () => void;
};

/** Follow-up links inside a notice, such as each item still to finish. */
export function NoticeBannerLinks({
  links,
}: {
  links: readonly NoticeBannerLink[];
}) {
  return (
    <ul className="flex flex-col sm:gap-1">
      {links.map((noticeLink) => (
        <li key={noticeLink.key}>
          <a
            href={noticeLink.href}
            onClick={(clickEvent: MouseEvent<HTMLAnchorElement>) => {
              if (!noticeLink.onSelect) return;
              clickEvent.preventDefault();
              noticeLink.onSelect();
            }}
            className="inline-flex min-h-11 items-center rounded-sm text-body font-semibold sm:min-h-8 text-primary underline underline-offset-4 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {noticeLink.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export type {
  NoticeBannerLink,
  NoticeBannerProperties,
  NoticeBannerTone,
  StateNoticeProperties,
  StateNoticeTone,
};
