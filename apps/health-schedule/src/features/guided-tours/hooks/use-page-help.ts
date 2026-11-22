"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";
import { useGuidedTour } from "@healthalyst/ui/hooks/use-guided-tour";
import {
  GUIDED_TOURS,
  hasGuidedTour,
} from "~/features/guided-tours/config/guided-tours";
import { PAGE_GUIDES } from "~/features/guided-tours/config/page-guides";
import { findPage } from "~/features/guided-tours/utilities/page-tour";

/** The current page's guide and, where it has one, its tour. */
export function usePageHelp() {
  const pathname = usePathname();
  const { startTour } = useGuidedTour();
  const page = findPage(pathname);
  const tourName = page && hasGuidedTour(page) ? page : null;

  const startPageTour = useCallback(
    (options: { returnFocusTo?: () => HTMLElement | null } = {}) =>
      tourName
        ? startTour({ steps: GUIDED_TOURS[tourName].steps, ...options })
        : Promise.resolve(false),
    [startTour, tourName]
  );

  return {
    guide: page ? PAGE_GUIDES[page] : null,
    tourName,
    startPageTour,
  };
}
