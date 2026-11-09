"use client";

import type { ReactNode } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { BrandLoader } from "@healthalyst/ui/components/brand-loader";
import { StateNotice } from "@healthalyst/ui/components/notice-banner";
import { BRAND_MARK_SOURCE } from "~/config/brand";
import {
  ProductAccessNotice,
  StatusPageLayout,
} from "~/features/product-access/components/product-access-notice";
import { HealthScheduleWorkspace } from "~/features/product-access/components/health-schedule-workspace";
import { resolveProductAccess } from "~/features/product-access/utilities/resolve-product-access";
import { usePlatformSession } from "~/infrastructure/auth/platform-session-provider";

/**
 * Picks HealthSchedule's first screen from the HealthAlyst sign-in made in
 * the organisation app: the sign-in options, the organisation's application
 * status, or the workspace once HealthSchedule confirms it can open.
 */
export function HealthScheduleEntry({
  signedOutView,
  children,
}: {
  /** Shown when nobody is signed in. */
  signedOutView: ReactNode;
  /** The page to show once the workspace opens. */
  children: ReactNode;
}) {
  const { platformSession, isRestoring, restoreError, restoreSession } =
    usePlatformSession();

  if (isRestoring) {
    return (
      <BrandLoader
        markSource={BRAND_MARK_SOURCE}
        label="Checking your HealthAlyst sign-in"
      />
    );
  }

  if (restoreError) {
    return (
      <StatusPageLayout>
        <StateNotice
          tone="error"
          title="We could not check your sign-in"
          action={
            <ActionButton type="button" onClick={() => void restoreSession()}>
              Try again
            </ActionButton>
          }
        >
          <p>{restoreError.message}</p>
        </StateNotice>
      </StatusPageLayout>
    );
  }

  if (!platformSession) return signedOutView;

  const productAccess = resolveProductAccess(platformSession);
  if (productAccess.status !== "ready") {
    return <ProductAccessNotice productAccess={productAccess} />;
  }

  return (
    <HealthScheduleWorkspace
      platformSession={platformSession}
      organization={productAccess.organization}
    >
      {children}
    </HealthScheduleWorkspace>
  );
}
