"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { REVIEW_APPLICATION_QUERY_PARAMETER } from "~/features/organization-oversight/config/review-queue";
import type { OrganizationApplication } from "~/features/organization-oversight/types/organization-types";

/** Keeps the application shown in the detail panel in the address. */
export function useOpenApplication(
  applications: readonly OrganizationApplication[]
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParameters = useSearchParams();
  const lastOpenApplicationReference = useRef<OrganizationApplication | null>(
    null
  );

  const openApplicationIdentifier = searchParameters.get(
    REVIEW_APPLICATION_QUERY_PARAMETER
  );
  const listedOpenApplication = applications.find(
    (application) => application.id === openApplicationIdentifier
  );
  // A decision can move the application out of the list; keep showing it
  // until the reviewer closes the panel.
  if (listedOpenApplication) {
    lastOpenApplicationReference.current = listedOpenApplication;
  }
  const openApplication =
    listedOpenApplication ??
    (lastOpenApplicationReference.current?.id === openApplicationIdentifier
      ? lastOpenApplicationReference.current
      : null);

  function setOpenApplication(applicationIdentifier: string | null) {
    const nextSearchParameters = new URLSearchParams(
      searchParameters.toString()
    );
    if (applicationIdentifier) {
      nextSearchParameters.set(
        REVIEW_APPLICATION_QUERY_PARAMETER,
        applicationIdentifier
      );
    } else {
      nextSearchParameters.delete(REVIEW_APPLICATION_QUERY_PARAMETER);
    }
    const query = nextSearchParameters.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, {
      scroll: false,
    });
  }

  return { openApplication, setOpenApplication };
}
