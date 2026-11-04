import type { Metadata } from "next";
import { BranchSettingsPage } from "~/features/organization-settings/components/branch-settings-page";

export const metadata: Metadata = {
  title: "Branch settings",
  robots: { index: false, follow: false },
};

export default async function BranchSettingsRoute({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const { branchId } = await params;
  return <BranchSettingsPage branchId={branchId} />;
}
