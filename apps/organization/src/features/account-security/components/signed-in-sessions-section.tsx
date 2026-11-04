"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { BrandLoader } from "@healthalyst/ui/components/brand-loader";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { FeedbackDialog } from "@healthalyst/ui/components/feedback-dialog";
import { HintText } from "@healthalyst/ui/components/hint-text";
import {
  NoticeBanner,
  StateNotice,
} from "@healthalyst/ui/components/notice-banner";
import { SignedInSessionList } from "@healthalyst/ui/components/signed-in-session-list";
import { BRAND_MARK_SOURCE } from "~/config/brand";
import {
  PLATFORM_SESSIONS_QUERY_KEY,
  SESSION_DATE_FORMATTER,
} from "~/features/account-security/config/account-security";
import { isStepUpRequiredError } from "~/features/account-security/hooks/use-step-up-protection";
import { describeSessionDevice } from "~/features/account-security/utilities/describe-session-device";
import {
  usePlatformSessionsQuery,
  useRevokePlatformSessionMutation,
  useSignOutAllSessionsMutation,
} from "~/features/authentication/hooks/use-platform-authentication";

export function SignedInSessionsSection({
  userId,
  runProtected,
  onSignedOutEverywhere,
}: {
  userId: string;
  runProtected: (action: {
    description: string;
    run: () => Promise<unknown>;
  }) => Promise<boolean>;
  onSignedOutEverywhere: () => void;
}) {
  const queryClient = useQueryClient();
  const sessionsQuery = usePlatformSessionsQuery({ userId });
  const revokeSessionMutation = useRevokePlatformSessionMutation();
  const signOutAllMutation = useSignOutAllSessionsMutation();
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const sessions = [...(sessionsQuery.data?.data ?? [])].sort(
    (firstSession, secondSession) =>
      Number(secondSession.current) - Number(firstSession.current) ||
      secondSession.lastUsedAt.localeCompare(firstSession.lastUsedAt)
  );
  const hasOtherSessions = sessions.some((session) => !session.current);
  const signOutAllError =
    signOutAllMutation.error && !isStepUpRequiredError(signOutAllMutation.error)
      ? signOutAllMutation.error.message
      : "";

  function endSession(sessionId: string) {
    revokeSessionMutation.mutate(
      { sessionId },
      {
        onSettled: () =>
          void queryClient.invalidateQueries({
            queryKey: [PLATFORM_SESSIONS_QUERY_KEY, userId],
          }),
      }
    );
  }

  function signOutEverywhere() {
    setIsConfirmationOpen(false);
    void runProtected({
      description: "sign out everywhere",
      run: () =>
        signOutAllMutation.mutateAsync(undefined, {
          onSuccess: onSignedOutEverywhere,
        }),
    });
  }

  return (
    <ContentPanel
      heading="Where you are signed in"
      description="Sign out of any device you do not recognise or no longer use."
      spacing="compact"
    >
      {sessionsQuery.isPending ? (
        <BrandLoader
          markSource={BRAND_MARK_SOURCE}
          label="Loading your sessions"
          presentation="inline"
        />
      ) : sessionsQuery.isError ? (
        <StateNotice
          tone="error"
          title="We could not load where you are signed in"
          action={
            <ActionButton
              type="button"
              variant="outline"
              onClick={() => void sessionsQuery.refetch()}
            >
              Try again
            </ActionButton>
          }
        >
          {sessionsQuery.error.message}
        </StateNotice>
      ) : (
        <div className="flex flex-col gap-4">
          <SignedInSessionList
            accessibleLabel="Signed-in devices"
            currentSessionLabel="This device"
            sessions={sessions.map((session) => {
              const deviceName = describeSessionDevice(session.userAgent);
              const isEnding =
                revokeSessionMutation.isPending &&
                revokeSessionMutation.variables.sessionId === session.id;
              return {
                key: session.id,
                title: deviceName,
                details: `Signed in ${SESSION_DATE_FORMATTER.format(new Date(session.createdAt))} · Last active ${SESSION_DATE_FORMATTER.format(new Date(session.lastUsedAt))}`,
                isCurrent: session.current,
                action: session.current ? undefined : (
                  <ActionButton
                    type="button"
                    variant="outline"
                    size="small"
                    aria-label={`Sign out ${deviceName}`}
                    isLoading={isEnding}
                    loadingText="Signing out"
                    disabled={revokeSessionMutation.isPending && !isEnding}
                    onClick={() => endSession(session.id)}
                  >
                    Sign out
                  </ActionButton>
                ),
              };
            })}
          />
          {!hasOtherSessions && (
            <HintText>You are not signed in anywhere else.</HintText>
          )}
          {revokeSessionMutation.error && (
            <NoticeBanner tone="error" title="That device was not signed out">
              {revokeSessionMutation.error.message}
            </NoticeBanner>
          )}
        </div>
      )}

      <div className="flex flex-col items-start gap-3 border-t border-border pt-5">
        <p className="text-body text-muted-foreground">
          Signing out everywhere also signs you out here. Use it if you think
          someone else has your password.
        </p>
        {signOutAllError && (
          <NoticeBanner tone="error" title="You are still signed in">
            {signOutAllError}
          </NoticeBanner>
        )}
        <ActionButton
          type="button"
          variant="outline"
          className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          isLoading={signOutAllMutation.isPending}
          loadingText="Signing out everywhere"
          onClick={() => {
            signOutAllMutation.reset();
            setIsConfirmationOpen(true);
          }}
        >
          Sign out everywhere
        </ActionButton>
      </div>

      <FeedbackDialog
        open={isConfirmationOpen}
        onOpenChange={setIsConfirmationOpen}
        tone="warning"
        title="Sign out everywhere?"
        description="You will be signed out on every device, including this one, and need to sign in again."
        primaryAction={{
          label: "Sign out everywhere",
          onSelect: signOutEverywhere,
        }}
        secondaryAction={{
          label: "Cancel",
          onSelect: () => setIsConfirmationOpen(false),
        }}
      />
    </ContentPanel>
  );
}
