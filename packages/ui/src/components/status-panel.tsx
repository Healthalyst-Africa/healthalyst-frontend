import type { ReactNode } from "react";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";

type StatusPanelProperties = {
  /** `loading` announces progress politely; `error` interrupts as an alert. */
  tone: "loading" | "error" | "information";
  title?: string;
  message: ReactNode;
  /** A recovery or follow-up action, such as a retry button. */
  action?: ReactNode;
  elevation?: "raised" | "flat";
};

/** A panel that reports the state of a page or workflow and offers recovery. */
export function StatusPanel({
  tone,
  title,
  message,
  action,
  elevation = "raised",
}: StatusPanelProperties) {
  const messageClassName =
    tone === "error" && !title
      ? "text-sm text-destructive"
      : "text-sm text-muted-foreground";

  return (
    <ContentPanel
      elevation={elevation}
      contentClassName="gap-4"
      role={tone === "error" ? "alert" : undefined}
      aria-busy={tone === "loading" || undefined}
    >
      <div className="flex flex-col gap-2">
        {title && <h2 className="font-semibold">{title}</h2>}
        <p
          className={messageClassName}
          role={tone === "loading" ? "status" : undefined}
        >
          {message}
        </p>
      </div>
      {action}
    </ContentPanel>
  );
}
