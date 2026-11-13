"use client";

import {
  createContext,
  use,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { SplitPanelLayout } from "@healthalyst/ui/components/split-panel-layout";
import HealthAlystBrand from "~/components/ui/healthalyst-brand";
import OnboardingHeroPanel from "~/components/ui/onboarding-hero-panel";

/** How many parts of the page currently show something other than the form. */
const CenteredViewRequestsContext = createContext<Dispatch<
  SetStateAction<number>
> | null>(null);

type OrganizationRegistrationLayoutProperties = {
  /** The page heading for assistive technology; the visible one is in the content. */
  pageTitle: string;
  showcaseLabel: string;
  showcaseLede: string;
  footerContent?: ReactNode;
  children: ReactNode;
};

/**
 * Registration beside the HealthAlyst showcase. The showcase belongs to the
 * registration form only: once something else fills the page, such as "Check
 * your email" after submitting, it becomes a single centred panel.
 */
export default function OrganizationRegistrationLayout({
  pageTitle,
  showcaseLabel,
  showcaseLede,
  footerContent,
  children,
}: OrganizationRegistrationLayoutProperties) {
  const [centeredViewRequests, setCenteredViewRequests] = useState(0);
  const isCentered = centeredViewRequests > 0;

  return (
    <CenteredViewRequestsContext value={setCenteredViewRequests}>
      <SplitPanelLayout
        className="bg-card"
        title={pageTitle}
        showcaseVisible={!isCentered}
        showcaseClassName="bg-primary text-primary-foreground"
        showcaseLabel={showcaseLabel}
        compactHeader={<HealthAlystBrand />}
        footer={footerContent}
        showcase={<OnboardingHeroPanel lede={showcaseLede} />}
      >
        {children}
      </SplitPanelLayout>
    </CenteredViewRequestsContext>
  );
}

/**
 * Centres the registration page, without the showcase, while `isActive` is
 * true. Does nothing outside `OrganizationRegistrationLayout`.
 */
export function useCenteredRegistrationView(isActive: boolean) {
  const setCenteredViewRequests = use(CenteredViewRequestsContext);

  useEffect(() => {
    if (!isActive || !setCenteredViewRequests) return;
    setCenteredViewRequests((requests) => requests + 1);
    return () => setCenteredViewRequests((requests) => requests - 1);
  }, [isActive, setCenteredViewRequests]);
}
