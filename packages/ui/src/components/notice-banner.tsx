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
  /**
   * A focal illustration from `@healthalyst/ui/illustrations/*` that replaces
   * the icon, for prominent page-level notices.
   */
  illustration?: ReactNode;
  /** A call to action shown on the right, or below the text on small screens. */
  action?: ReactNode;
  /** `prominent` suits a page-level summary with more room and a larger title. */
  size?: "default" | "prominent";
  className?: string;
};

/**
 * A notice with a title, a tone-specific icon and optional details or links.
 * Errors and warnings are announced immediately; other tones politely.
 */
export function NoticeBanner({
  tone = "neutral",
  title,
  children,
  icon,
  illustration,
  action,
  size = "default",
  className,
}: NoticeBannerProperties) {
  const presentation = TONE_PRESENTATION[tone];
  const ToneIcon = presentation.icon;
  const shownIcon =
    icon ?? (ToneIcon ? <ToneIcon aria-hidden="true" /> : undefined);
  const isProminent = size === "prominent";
  const role = tone === "error" || tone === "warning" ? "alert" : "status";
  const content = (
    <>
      <AlertTitle className={cn(isProminent && "mb-1.5 text-base leading-6")}>
        {title}
      </AlertTitle>
      {children && (
        <AlertDescription
          className={cn(
            "flex flex-col items-start gap-3",
            tone !== "error" && "text-muted-foreground",
            isProminent && "gap-4 leading-6"
          )}
        >
          {children}
        </AlertDescription>
      )}
    </>
  );

  if (illustration) {
    return (
      <Alert
        variant={presentation.variant}
        role={role}
        className={cn(
          "flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5",
          isProminent && "rounded-xl px-5 py-5 sm:px-6",
          className
        )}
      >
        {/* Illustrations sit on a white disc so they read on any tone. */}
        <div
          aria-hidden="true"
          className="w-14 shrink-0 [--illustration-base:hsl(var(--background))] sm:w-16 [&_svg]:h-auto [&_svg]:w-full"
        >
          {illustration}
        </div>
        <div className="flex min-w-0 flex-1 flex-col sm:pt-1">{content}</div>
        {action && <div className="shrink-0 sm:self-center">{action}</div>}
      </Alert>
    );
  }

  return (
    <Alert
      variant={presentation.variant}
      role={role}
      className={cn(
        "[&>svg]:size-4",
        isProminent &&
          "rounded-xl px-5 py-5 sm:px-6 [&>svg]:left-5 [&>svg]:top-[1.4rem] [&>svg]:size-5 sm:[&>svg]:left-6 [&>svg~*]:pl-8",
        className
      )}
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
    <ul className="flex flex-col gap-1">
      {links.map((noticeLink) => (
        <li key={noticeLink.key}>
          <a
            href={noticeLink.href}
            onClick={(clickEvent: MouseEvent<HTMLAnchorElement>) => {
              if (!noticeLink.onSelect) return;
              clickEvent.preventDefault();
              noticeLink.onSelect();
            }}
            className="inline-flex min-h-8 items-center rounded-sm text-sm font-semibold text-primary underline underline-offset-4 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {noticeLink.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export type { NoticeBannerLink, NoticeBannerProperties, NoticeBannerTone };
