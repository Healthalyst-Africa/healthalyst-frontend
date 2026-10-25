"use client";

import type { ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@healthalyst/ui/primitives/accordion";

type ExpandableSectionProperties = {
  /** The always-visible trigger text, phrased as what the content answers. */
  title: string;
  children: ReactNode;
  className?: string;
};

/** Optional help or detail that stays collapsed until the reader opens it. */
export function ExpandableSection({
  title,
  children,
  className,
}: ExpandableSectionProperties) {
  return (
    <Accordion type="single" collapsible className={className}>
      <AccordionItem value="expandable-section" className="border-b-0">
        <AccordionTrigger className="py-4 text-sm font-medium hover:no-underline">
          {title}
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-3">
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
