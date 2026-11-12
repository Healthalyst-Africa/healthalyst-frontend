import type { ReactNode } from "react";
import { SplitPanelLayout } from "@healthalyst/ui/components/split-panel-layout";
import HealthAlystBrand from "~/components/ui/healthalyst-brand";

type OrganizationCenteredLayoutProperties = {
  /** The page heading for assistive technology; the visible one is in the content. */
  pageTitle: string;
  children: ReactNode;
  footerContent?: ReactNode;
};

/**
 * A single centred panel under the HealthAlyst brand, for every account page
 * and step other than sign-in and registration, which keep the showcase.
 */
export default function OrganizationCenteredLayout({
  pageTitle,
  children,
  footerContent,
}: OrganizationCenteredLayoutProperties) {
  return (
    <SplitPanelLayout
      className="bg-card"
      title={pageTitle}
      showcaseVisible={false}
      showcase={null}
      showcaseLabel={pageTitle}
      compactHeader={<HealthAlystBrand />}
      footer={footerContent}
    >
      {children}
    </SplitPanelLayout>
  );
}
