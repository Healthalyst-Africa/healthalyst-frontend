import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { OnboardingLayout } from "@healthalyst/ui/components/onboarding-layout";
import { ORGANIZATION_ROUTES } from "~/config/routes";

export default function OrganizationOnboardingLayout({
  children,
  progress,
  actions,
}: {
  children: ReactNode;
  progress?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <OnboardingLayout
      brand={
        <Link
          href={ORGANIZATION_ROUTES.onboarding}
          className="flex items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="HealthAlyst organisation onboarding"
        >
          <Image
            src="/logo.jpg"
            width={1024}
            height={1023}
            sizes="44px"
            className="size-11 object-contain"
            alt=""
          />
          <span className="text-sm font-semibold">HealthAlyst</span>
        </Link>
      }
      progress={progress}
      actions={actions}
    >
      {children}
    </OnboardingLayout>
  );
}
