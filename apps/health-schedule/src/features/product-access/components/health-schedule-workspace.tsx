"use client";

import type { PlatformSession } from "@healthalyst/platform-api/authentication-service";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { BrandLoader } from "@healthalyst/ui/components/brand-loader";
import { StateNotice } from "@healthalyst/ui/components/notice-banner";
import { BRAND_MARK_SOURCE } from "~/config/brand";
import { HealthScheduleHome } from "~/features/product-access/components/health-schedule-home";
import {
  ProductAccessNotice,
  SignOutControl,
  StatusPageLayout,
} from "~/features/product-access/components/product-access-notice";
import { useProductAvailability } from "~/features/product-access/hooks/use-product-availability";
import { resolveProductAvailabilityFailure } from "~/features/product-access/utilities/resolve-product-availability";

/**
 * Opens the workspace once HealthSchedule itself confirms the organisation
 * can use it. The Platform API's product list can arrive before
 * HealthSchedule has received the approval.
 */
export function HealthScheduleWorkspace({
  platformSession,
  organization,
}: {
  platformSession: PlatformSession;
  organization: { id: string; name: string };
}) {
  const productAvailability = useProductAvailability(organization.id);

  if (productAvailability.isPending) {
    return (
      <BrandLoader
        markSource={BRAND_MARK_SOURCE}
        label="Opening HealthSchedule"
      />
    );
  }

  if (productAvailability.isError) {
    const failure = resolveProductAvailabilityFailure(
      productAvailability.error
    );
    if (failure.status === "organization-unavailable") {
      return (
        <ProductAccessNotice
          productAccess={{ status: "access-unavailable", organization }}
        />
      );
    }
    const retryAction = (
      <ActionButton
        type="button"
        isLoading={productAvailability.isFetching}
        loadingText="Checking"
        onClick={() => void productAvailability.refetch()}
      >
        Try again
      </ActionButton>
    );
    return (
      <StatusPageLayout headerAction={<SignOutControl />}>
        {failure.status === "setup-pending" ? (
          <StateNotice
            tone="information"
            title="HealthSchedule is still being set up"
            action={retryAction}
          >
            <p>
              {organization.name} has HealthSchedule, but it is not ready to
              open yet. This usually takes less than a minute.
            </p>
          </StateNotice>
        ) : (
          <StateNotice
            tone="error"
            title="We could not open HealthSchedule"
            action={retryAction}
          >
            <p>{failure.message}</p>
          </StateNotice>
        )}
      </StatusPageLayout>
    );
  }

  return (
    <HealthScheduleHome
      platformSession={platformSession}
      organizationName={productAvailability.data.name}
    />
  );
}
