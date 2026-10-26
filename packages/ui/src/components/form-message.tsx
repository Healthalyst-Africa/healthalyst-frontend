import type { ReactNode } from "react";
import { FieldError } from "@healthalyst/ui/primitives/field";
import { cn } from "@healthalyst/ui/lib/utilities";

type FormMessageProperties = {
  /**
   * `error` is announced immediately; `status` and `success` are announced
   * politely when they change.
   */
  tone: "error" | "status" | "success";
  children: ReactNode;
  /** Supporting content below the message, such as a recovery link. */
  details?: ReactNode;
  align?: "start" | "center";
  className?: string;
};

/** Form-level feedback that is not tied to a single field. */
export function FormMessage({
  tone,
  children,
  details,
  align = "start",
  className,
}: FormMessageProperties) {
  const alignmentClassName = align === "center" && "items-center text-center";

  if (tone === "error") {
    return (
      <div
        role="alert"
        className={cn("flex flex-col gap-1", alignmentClassName, className)}
      >
        <FieldError role={undefined}>{children}</FieldError>
        {details}
      </div>
    );
  }

  return (
    <div
      role="status"
      className={cn(
        "flex flex-col gap-1 text-sm leading-6",
        tone === "success" ? "text-primary" : "text-muted-foreground",
        alignmentClassName,
        className
      )}
    >
      <p>{children}</p>
      {details}
    </div>
  );
}
