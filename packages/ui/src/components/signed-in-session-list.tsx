import type { ReactNode } from "react";
import { StatusLabel } from "@healthalyst/ui/components/status-label";

type SignedInSession = {
  key: string;
  /** The device and browser, such as "Chrome on Windows". */
  title: string;
  /** When the session started and was last used. */
  details: string;
  isCurrent: boolean;
  /** An action for another session, such as a "Sign out" button. */
  action?: ReactNode;
};

/**
 * The places a person is signed in, with the current device marked and an
 * action for each of the others.
 */
export function SignedInSessionList({
  sessions,
  accessibleLabel,
  currentSessionLabel,
}: {
  sessions: readonly SignedInSession[];
  accessibleLabel: string;
  /** Marks the device being used now, such as "This device". */
  currentSessionLabel: string;
}) {
  return (
    <ul aria-label={accessibleLabel} className="flex flex-col gap-2">
      {sessions.map((session) => (
        <li
          key={session.key}
          className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-secondary/50 px-4 py-3"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="flex flex-wrap items-center gap-2 text-body font-medium">
              {session.title}
              {session.isCurrent && (
                <StatusLabel tone="information">
                  {currentSessionLabel}
                </StatusLabel>
              )}
            </p>
            <p className="text-caption text-muted-foreground">
              {session.details}
            </p>
          </div>
          {session.action && <div className="shrink-0">{session.action}</div>}
        </li>
      ))}
    </ul>
  );
}

export type { SignedInSession };
