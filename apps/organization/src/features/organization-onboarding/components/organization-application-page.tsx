"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@healthalyst/ui/components/card";
import OrganizationApplicationLayout from "~/components/ui/organization-application-layout";
import OrganizationApplicationSummary from "~/features/organization-onboarding/components/organization-application-summary";
import { usePlatformSession } from "~/infrastructure/auth/platform-session-provider";

export default function OrganizationApplicationPage() {
  const router = useRouter();
  const { platformSession, clearPlatformSession } = usePlatformSession();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted && !platformSession) {
      router.replace("/sign-in");
    }
  }, [hasMounted, platformSession, router]);

  function handleSignedOut() {
    clearPlatformSession();
  }

  return (
    <OrganizationApplicationLayout>
      {hasMounted && platformSession ? (
        <OrganizationApplicationSummary
          session={platformSession}
          onSignedOut={handleSignedOut}
        />
      ) : (
        <Card className="border-border bg-card shadow-sm" aria-busy="true">
          <CardContent className="px-5 py-6 sm:px-6 md:px-8 md:py-8">
            <p className="text-sm text-muted-foreground" role="status">
              Checking your sign-in…
            </p>
          </CardContent>
        </Card>
      )}
    </OrganizationApplicationLayout>
  );
}
