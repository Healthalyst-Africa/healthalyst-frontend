"use client";

import { useEffect } from "react";
import { BrandLoader } from "@healthalyst/ui/components/brand-loader";
import { StateNotice } from "@healthalyst/ui/components/notice-banner";
import { BRAND_MARK_SOURCE } from "~/config/brand";
import { getOrganizationAppLinks } from "~/features/organization-access/services/organization-app-links";
import { StatusPageLayout } from "~/features/product-access/components/product-access-notice";
import { SignInPage } from "~/features/sign-in/components/sign-in-page";
import { useSignInPlace } from "~/features/sign-in/hooks/use-sign-in-place";

/**
 * What a signed-out person sees. Phones, tablets and the installed app sign
 * in on HealthSchedule's own page. A desktop browser goes to the HealthAlyst
 * account hub, which signs them in and sends them back here.
 */
export function SignedOutEntry() {
  const signInPlace = useSignInPlace();
  const hubSignInAddress = getOrganizationAppLinks()?.signIn ?? null;
  const isLeavingForHub = signInPlace === "hub" && hubSignInAddress !== null;

  useEffect(() => {
    if (isLeavingForHub) window.location.replace(hubSignInAddress);
  }, [isLeavingForHub, hubSignInAddress]);

  if (signInPlace === "in-app") return <SignInPage />;

  if (signInPlace === "hub" && !hubSignInAddress) {
    return (
      <StatusPageLayout>
        <StateNotice tone="error" title="Sign-in is not set up">
          <p>
            The HealthAlyst account address is not configured. Set
            NEXT_PUBLIC_HEALTHALYST_ORGANIZATION_APP_URL.
          </p>
        </StateNotice>
      </StatusPageLayout>
    );
  }

  return (
    <BrandLoader
      markSource={BRAND_MARK_SOURCE}
      label={
        isLeavingForHub
          ? "Opening HealthAlyst sign-in"
          : "Checking your HealthAlyst sign-in"
      }
    />
  );
}
