"use client";

import { VisitProgress } from "@healthalyst/ui/components/visit-progress";
import { useVisitDetail } from "~/features/patient-flow/hooks/use-patient-flow";
import { describeVisitStops } from "~/features/patient-flow/utilities/visit-progress";
import { describeBranchClockTime } from "~/shared/time/branch-time";

/** Where a patient has been on today's visit and where they are now. */
export function VisitProgressPanel({
  visitId,
  headingLevel = 3,
}: {
  visitId: string;
  headingLevel?: 2 | 3;
}) {
  const visitQuery = useVisitDetail(visitId, true);
  if (!visitQuery.isSuccess) return null;
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <section className="flex flex-col gap-2 text-sm">
      <Heading className="font-medium">
        Today&apos;s visit, checked in at{" "}
        {describeBranchClockTime(visitQuery.data.checkedInAt)}
      </Heading>
      <VisitProgress steps={describeVisitStops(visitQuery.data)} />
    </section>
  );
}
