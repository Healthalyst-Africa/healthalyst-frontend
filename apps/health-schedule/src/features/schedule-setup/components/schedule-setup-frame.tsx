"use client";

import type { ReactNode } from "react";
import { StateNotice } from "@healthalyst/ui/components/notice-banner";
import { SCHEDULE_PERMISSIONS } from "~/features/schedule-setup/config/schedule-setup";
import { useWorkspace } from "~/shared/workspace/workspace-context";

/** What a schedule setup page may do for the signed-in person. */
export type ScheduleSetupAccess = {
  canManage: boolean;
  canChoosePractitioners: boolean;
};

/**
 * The heading and permission check every schedule setup page shares.
 * Viewing needs `schedule:read`; changes need `schedule:manage`.
 */
export function ScheduleSetupFrame({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  /** The page's main action, such as "Add a calendar", for people who can manage. */
  action?: (access: ScheduleSetupAccess) => ReactNode;
  children: (access: ScheduleSetupAccess) => ReactNode;
}) {
  const { permissions } = useWorkspace();
  const access: ScheduleSetupAccess = {
    canManage: permissions.includes(SCHEDULE_PERMISSIONS.manage),
    canChoosePractitioners: permissions.includes(
      SCHEDULE_PERMISSIONS.staffRead
    ),
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex max-w-2xl flex-col gap-2">
          <h1 className="font-serif text-title font-normal tracking-tight">
            {title}
          </h1>
          <p className="text-body text-muted-foreground">{description}</p>
        </div>
        {permissions.includes(SCHEDULE_PERMISSIONS.read) && action?.(access)}
      </div>
      {permissions.includes(SCHEDULE_PERMISSIONS.read) ? (
        children(access)
      ) : (
        <StateNotice
          tone="information"
          title="Your role cannot see the schedule"
        >
          <p>
            Ask an organisation administrator to add the “View calendars and
            free slots” permission to your role.
          </p>
        </StateNotice>
      )}
    </div>
  );
}
