import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@healthalyst/ui/primitives/card";
import { cn } from "@healthalyst/ui/lib/utilities";

const CONTENT_SPACING_CLASS_NAMES = {
  comfortable: "flex flex-col gap-5 px-6 py-7 md:px-8 md:py-8",
  compact: "flex flex-col gap-5 p-5 sm:p-8",
  flush: "flex flex-col p-0",
} as const;

const HEADER_SPACING_CLASS_NAMES = {
  comfortable: "px-6 pb-5 pt-7 md:px-8 md:pt-8",
  compact: "px-5 pb-5 pt-5 sm:px-8 sm:pt-8",
  flush: "p-6",
} as const;

type ContentPanelProperties = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  heading?: ReactNode;
  /** The heading element, chosen to keep the page's heading order. */
  headingLevel?: 2 | 3;
  /** Content beside the heading, such as a status badge. */
  headingAccessory?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  /** `raised` panels stand on the page; `flat` panels sit inside a workflow. */
  elevation?: "raised" | "flat";
  spacing?: keyof typeof CONTENT_SPACING_CLASS_NAMES;
  contentClassName?: string;
  footerClassName?: string;
  children: ReactNode;
};

/**
 * A bordered surface for one task or piece of content, with an optional
 * heading row and an optional footer for actions.
 */
const ContentPanel = forwardRef<HTMLDivElement, ContentPanelProperties>(
  (
    {
      heading,
      headingLevel = 2,
      headingAccessory,
      description,
      footer,
      elevation = "raised",
      spacing = "comfortable",
      className,
      contentClassName,
      footerClassName,
      children,
      ...properties
    },
    elementReference
  ) => {
    const HeadingElement = headingLevel === 3 ? "h3" : "h2";

    return (
      <Card
        ref={elementReference}
        className={cn(
          "border-border bg-card",
          elevation === "raised" ? "shadow-sm" : "shadow-none",
          className
        )}
        {...properties}
      >
        {(heading || description) && (
          <CardHeader
            className={cn("gap-2", HEADER_SPACING_CLASS_NAMES[spacing])}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              {heading && (
                <HeadingElement className="text-lg font-semibold leading-none tracking-tight">
                  {heading}
                </HeadingElement>
              )}
              {headingAccessory}
            </div>
            {description && (
              <div className="text-sm text-muted-foreground">{description}</div>
            )}
          </CardHeader>
        )}
        <CardContent
          className={cn(
            CONTENT_SPACING_CLASS_NAMES[spacing],
            (heading || description) &&
              spacing !== "flush" &&
              "pt-0 sm:pt-0 md:pt-0",
            contentClassName
          )}
        >
          {children}
        </CardContent>
        {footer && (
          <CardFooter
            className={cn(
              "flex flex-col gap-4 border-t border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8",
              footerClassName
            )}
          >
            {footer}
          </CardFooter>
        )}
      </Card>
    );
  }
);

ContentPanel.displayName = "ContentPanel";

export { ContentPanel };
export type { ContentPanelProperties };
