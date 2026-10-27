import Image from "next/image";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { SplitPanelLayout } from "@healthalyst/ui/components/split-panel-layout";
import HealthAlystBrand from "~/components/ui/healthalyst-brand";
import { getOrganizationAppLinks } from "~/features/organization-access/services/organization-app-links";

const PRIMARY_LINK_CLASS_NAME =
  "inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const SECONDARY_LINK_CLASS_NAME =
  "inline-flex h-11 w-full items-center justify-center rounded-full border border-input px-8 text-sm font-semibold transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/**
 * HealthSchedule's entry point. Organisations register and sign in once, in
 * the shared HealthAlyst organisation app, for every HealthAlyst product;
 * this page sends them there.
 */
export function OrganizationAccessPage() {
  const organizationAppLinks = getOrganizationAppLinks();

  return (
    <SplitPanelLayout
      className="bg-card"
      title="HealthSchedule"
      showcaseClassName="bg-primary text-primary-foreground"
      showcaseLabel="About HealthSchedule"
      compactHeader={<HealthAlystBrand />}
      showcase={
        <>
          <div aria-hidden="true" className="absolute inset-0 -z-20">
            <Image
              alt=""
              className="object-cover"
              fill
              preload
              sizes="50vw"
              src="/images/module-hospital.webp"
            />
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,hsl(var(--primary)/0.94),hsl(var(--primary)/0.78)_40%,hsl(var(--primary)/0.5))]"
          />
          <div className="flex size-full flex-col items-start justify-between gap-10 text-left">
            <div className="rounded-lg bg-card p-1">
              <HealthAlystBrand />
            </div>
            <div className="flex flex-col gap-5">
              <p className="max-w-[18ch] text-balance font-serif text-[clamp(2rem,1rem+2.4vw,3.5rem)] font-normal leading-[1.08] tracking-[-0.01em]">
                HealthSchedule
              </p>
              <p className="max-w-[44ch] text-base leading-[1.6] opacity-90 xl:text-lg">
                Patient scheduling and clinical operations for hospitals and
                clinics.
              </p>
            </div>
          </div>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="font-serif text-title font-normal">
            Welcome to HealthSchedule
          </h2>
          <p className="max-w-sm text-lede text-muted-foreground">
            HealthSchedule is part of HealthAlyst. Your organisation registers
            and signs in once for every HealthAlyst product.
          </p>
        </div>
        <ContentPanel contentClassName="gap-3">
          {organizationAppLinks ? (
            <>
              <a
                className={PRIMARY_LINK_CLASS_NAME}
                href={organizationAppLinks.signIn}
              >
                Sign in with HealthAlyst
              </a>
              <a
                className={SECONDARY_LINK_CLASS_NAME}
                href={organizationAppLinks.registration}
              >
                Register your organisation
              </a>
            </>
          ) : (
            <p className="text-sm text-destructive" role="alert">
              The HealthAlyst organisation app address is not configured. Set
              NEXT_PUBLIC_HEALTHALYST_ORGANIZATION_APP_URL.
            </p>
          )}
        </ContentPanel>
      </div>
    </SplitPanelLayout>
  );
}
