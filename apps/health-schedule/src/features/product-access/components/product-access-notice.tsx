"use client";

import type { ReactNode } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { StateNotice } from "@healthalyst/ui/components/notice-banner";
import HealthAlystBrand from "~/components/ui/healthalyst-brand";
import { getOrganizationAppLinks } from "~/features/organization-access/services/organization-app-links";
import { useHealthScheduleSignOut } from "~/features/product-access/hooks/use-health-schedule-sign-out";
import type { ProductAccess } from "~/features/product-access/utilities/resolve-product-access";

type RestrictedProductAccess = Exclude<ProductAccess, { status: "ready" }>;

type NoticeContent = {
  tone: "information" | "warning" | "error";
  title: string;
  description: string;
  actionLabel: string;
};

const LINK_CLASS_NAME =
  "inline-flex h-10 items-center justify-center whitespace-nowrap rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function describeAccess(productAccess: RestrictedProductAccess): NoticeContent {
  switch (productAccess.status) {
    case "application-in-review":
      return {
        tone: "information",
        title: "Your application is under review",
        description: `HealthAlyst is reviewing ${productAccess.organization.name}. HealthSchedule opens once your organisation is approved.`,
        actionLabel: "View application",
      };
    case "application-in-progress":
      return {
        tone: "warning",
        title: "Finish your organisation application",
        description: `${productAccess.organization.name} needs to complete and submit its application before HealthSchedule can open.`,
        actionLabel: "Continue application",
      };
    case "product-not-enabled":
      return {
        tone: "warning",
        title: "HealthSchedule is not enabled",
        description: `${productAccess.organization.name} is approved, but HealthSchedule is not one of its products.`,
        actionLabel: "Open your organisation",
      };
    case "access-unavailable":
      return {
        tone: "error",
        title: "HealthSchedule is not available",
        description: `${productAccess.organization.name} does not currently have access to HealthAlyst products. Your organisation account shows the details.`,
        actionLabel: "Open your organisation",
      };
    case "no-organization":
      return {
        tone: "information",
        title: "No organisation is linked to this account",
        description:
          "HealthSchedule is used through an organisation. Sign in with an account that belongs to one, or register your organisation.",
        actionLabel: "Open HealthAlyst",
      };
  }
}

/** A status screen with the brand, page heading and an optional header control. */
export function StatusPageLayout({
  headerAction,
  children,
}: {
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-card">
      <header className="flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <HealthAlystBrand />
        {headerAction}
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16 sm:px-8">
        <div className="flex w-full max-w-2xl flex-col gap-6">
          <h1 className="font-serif text-3xl font-normal leading-tight">
            HealthSchedule
          </h1>
          {children}
        </div>
      </main>
    </div>
  );
}

function SignOutControl() {
  const signOutMutation = useHealthScheduleSignOut();

  return (
    <div className="flex flex-col items-end gap-1">
      <ActionButton
        type="button"
        variant="ghost"
        isLoading={signOutMutation.isPending}
        onClick={() => signOutMutation.mutate()}
      >
        Sign out
      </ActionButton>
      {signOutMutation.isError && (
        <p className="text-xs text-destructive" role="alert">
          {signOutMutation.error.message}
        </p>
      )}
    </div>
  );
}

/** Explains why a signed-in organisation cannot open HealthSchedule yet. */
export function ProductAccessNotice({
  productAccess,
}: {
  productAccess: RestrictedProductAccess;
}) {
  const organizationAppLinks = getOrganizationAppLinks();
  const content = describeAccess(productAccess);
  const actionAddress =
    productAccess.status === "no-organization"
      ? organizationAppLinks?.signIn
      : organizationAppLinks?.application;

  return (
    <StatusPageLayout headerAction={<SignOutControl />}>
      <StateNotice
        tone={content.tone}
        title={content.title}
        action={
          actionAddress ? (
            <a className={LINK_CLASS_NAME} href={actionAddress}>
              {content.actionLabel}
            </a>
          ) : undefined
        }
      >
        <p>{content.description}</p>
      </StateNotice>
    </StatusPageLayout>
  );
}
