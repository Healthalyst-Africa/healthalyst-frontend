import type { ReactNode } from "react";
import { cn } from "@healthalyst/ui/lib/utilities";

type SplitPanelLayoutProperties = {
  title: string;
  showcase: ReactNode;
  showcaseLabel: string;
  children: ReactNode;
  compactHeader?: ReactNode;
  footer?: ReactNode;
  className?: string;
  showcaseClassName?: string;
  contentClassName?: string;
  contentWidthClassName?: string;
};

/**
 * Two-column page with a showcase panel beside the main content. On large
 * screens the page fits the viewport, and the main content's outermost element
 * scrolls within its own border. The showcase is hidden on smaller screens,
 * where `compactHeader` takes its place above the content. The visible
 * headings live in the content, so `title` is the page heading for assistive
 * technology.
 */
export function SplitPanelLayout({
  title,
  showcase,
  showcaseLabel,
  children,
  compactHeader,
  footer,
  className,
  showcaseClassName,
  contentClassName,
  contentWidthClassName = "max-w-lg",
}: SplitPanelLayoutProperties) {
  return (
    // The page background fills the window. The panel and the content column
    // keep their own widths and are centred together as one group, so wide
    // screens show equal margins on both sides.
    <div className={cn("min-h-dvh", className)}>
      <div className="grid min-h-dvh w-full gap-6 p-4 lg:h-dvh lg:grid-cols-[min(45.5rem,calc((100%_-_4rem)/2))_minmax(0,32rem)] lg:grid-rows-[minmax(0,1fr)] lg:justify-center lg:gap-16 lg:overflow-hidden lg:p-6">
        <aside
          aria-label={showcaseLabel}
          className={cn(
            "relative isolate hidden h-full flex-col items-center justify-center gap-8 overflow-hidden rounded-2xl p-10 text-center lg:flex xl:p-14",
            showcaseClassName
          )}
        >
          {showcase}
        </aside>
        <main
          className={cn(
            "flex flex-col items-center justify-center px-1 py-8 sm:px-6 lg:min-h-0 lg:px-0 lg:py-0",
            contentClassName
          )}
        >
          <h1 className="sr-only">{title}</h1>
          <div
            className={cn(
              "flex w-full flex-col items-center gap-6 lg:max-h-full lg:min-h-0",
              contentWidthClassName
            )}
          >
            {compactHeader && <div className="lg:hidden">{compactHeader}</div>}
            <div className="flex w-full flex-col lg:min-h-0 [&>*]:w-full lg:[&>*]:relative lg:[&>*]:min-h-0 lg:[&>*]:overflow-y-auto lg:[&>*]:overscroll-contain">
              {children}
            </div>
            {footer && <div className="shrink-0">{footer}</div>}
          </div>
        </main>
      </div>
    </div>
  );
}
