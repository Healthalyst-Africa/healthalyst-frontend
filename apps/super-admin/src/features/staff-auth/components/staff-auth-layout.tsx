import type { ReactNode, RefObject } from "react";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { SplitPanelLayout } from "@healthalyst/ui/components/split-panel-layout";
import {
  StaffAuthBrand,
  StaffAuthShowcase,
} from "~/features/staff-auth/components/staff-auth-showcase";

type StaffAuthLayoutProperties = {
  title: string;
  description: string;
  headingReference: RefObject<HTMLHeadingElement | null>;
  footer?: ReactNode;
  children: ReactNode;
};

/** Staff sign-in and account recovery page with the company workspace showcase. */
export function StaffAuthLayout({
  title,
  description,
  headingReference,
  footer,
  children,
}: StaffAuthLayoutProperties) {
  return (
    <SplitPanelLayout
      className="bg-card"
      title={title}
      showcase={<StaffAuthShowcase />}
      showcaseClassName="bg-primary text-primary-foreground"
      showcaseLabel="HealthAlyst company workspace"
      compactHeader={<StaffAuthBrand />}
      footer={footer}
    >
      <div className="flex flex-col gap-6">
        <header className="flex flex-col items-center gap-2 text-center">
          <h2
            ref={headingReference}
            className="font-serif text-title font-normal outline-none"
            tabIndex={-1}
          >
            {title}
          </h2>
          <p className="max-w-sm text-lede text-muted-foreground">
            {description}
          </p>
        </header>
        <ContentPanel frame="wide-screens">{children}</ContentPanel>
      </div>
    </SplitPanelLayout>
  );
}
