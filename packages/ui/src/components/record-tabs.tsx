"use client";

import type { ReactNode } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@healthalyst/ui/primitives/tabs";
import { cn } from "@healthalyst/ui/lib/utilities";

type RecordTab = {
  value: string;
  label: string;
  /** Shown beside the label, such as the number of documents. */
  count?: number;
  content: ReactNode;
};

/**
 * A record's sections as tabs under its header, such as a patient's overview,
 * family and documents. Arrow keys move between tabs; the list scrolls
 * sideways on narrow screens rather than wrapping.
 */
export function RecordTabs({
  accessibleLabel,
  tabs,
  value,
  onValueChange,
  className,
}: {
  accessibleLabel: string;
  tabs: readonly RecordTab[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}) {
  return (
    <Tabs
      value={value}
      onValueChange={onValueChange}
      className={cn("flex flex-col gap-6", className)}
    >
      <div className="-mx-1 overflow-x-auto px-1">
        <TabsList
          aria-label={accessibleLabel}
          className="h-auto w-max justify-start gap-1 rounded-none border-b bg-transparent p-0"
        >
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="-mb-px gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm text-muted-foreground shadow-none hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                  {tab.count}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-0">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export type { RecordTab };
