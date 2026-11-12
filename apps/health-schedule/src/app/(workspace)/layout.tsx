import type { ReactNode } from "react";
import { SignedOutEntry } from "~/features/sign-in/components/signed-out-entry";
import { HealthScheduleEntry } from "~/features/product-access/components/health-schedule-entry";

/** Every workspace page opens after the sign-in, application and product checks. */
export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <HealthScheduleEntry signedOutView={<SignedOutEntry />}>
      {children}
    </HealthScheduleEntry>
  );
}
