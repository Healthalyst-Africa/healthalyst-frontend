import type { ReactNode } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@healthalyst/ui/primitives/alert";
import { cn } from "@healthalyst/ui/lib/utilities";

type NoticeBannerProperties = {
  /** `error` uses destructive colours for failures that need attention. */
  tone?: "information" | "error";
  title: ReactNode;
  children?: ReactNode;
  /** A decorative icon, hidden from assistive technology by the caller. */
  icon?: ReactNode;
  className?: string;
};

/** A prominent notice with a title and optional details or actions. */
export function NoticeBanner({
  tone = "information",
  title,
  children,
  icon,
  className,
}: NoticeBannerProperties) {
  return (
    <Alert
      variant={tone === "error" ? "destructive" : "default"}
      className={cn("[&>svg]:size-4", className)}
    >
      {icon}
      <AlertTitle>{title}</AlertTitle>
      {children && (
        <AlertDescription
          className={cn(
            "flex flex-col items-start gap-3",
            tone === "information" && icon && "text-muted-foreground"
          )}
        >
          {children}
        </AlertDescription>
      )}
    </Alert>
  );
}
