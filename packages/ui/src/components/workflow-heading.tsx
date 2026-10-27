"use client";

import { useEffect, useRef } from "react";

type WorkflowHeadingProperties = {
  heading: string;
  introduction: string;
  stepNumber?: number;
  totalSteps?: number;
  focusOnChange?: boolean;
};

/** A workflow heading that announces a step change to keyboard and screen-reader users. */
export function WorkflowHeading({
  heading,
  introduction,
  stepNumber,
  totalSteps,
  focusOnChange = true,
}: WorkflowHeadingProperties) {
  const headingReference = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focusOnChange) headingReference.current?.focus();
  }, [heading, focusOnChange]);

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <h2
        ref={headingReference}
        className="font-serif text-title font-normal outline-none"
        tabIndex={-1}
      >
        {stepNumber !== undefined && (
          <span className="sr-only">
            {totalSteps === undefined
              ? `Step ${stepNumber}: `
              : `Step ${stepNumber} of ${totalSteps}: `}
          </span>
        )}
        {heading}
      </h2>
      <p className="max-w-sm text-lede text-muted-foreground">{introduction}</p>
    </div>
  );
}
