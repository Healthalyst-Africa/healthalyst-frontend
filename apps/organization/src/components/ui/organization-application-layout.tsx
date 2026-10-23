import type { ReactNode } from "react";
import { SplitPanelLayout } from "@healthalyst/ui/components/split-panel-layout";
import HealthAlystBrand from "~/components/ui/healthalyst-brand";

export default function OrganizationApplicationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SplitPanelLayout
      className="bg-card"
      title="Your organisation application"
      showcase={null}
      showcaseLabel="About your organisation application"
      showcaseVisible={false}
      compactHeader={<HealthAlystBrand />}
      contentWidthClassName="max-w-7xl"
    >
      {children}
    </SplitPanelLayout>
  );
}
