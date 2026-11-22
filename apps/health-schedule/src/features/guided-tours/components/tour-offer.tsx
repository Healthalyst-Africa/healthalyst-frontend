"use client";

import { useEffect, useRef } from "react";
import { offerChoice } from "@healthalyst/ui/components/toast-region";
import { findHelpButton } from "~/features/guided-tours/components/page-help-button";
import { usePageHelp } from "~/features/guided-tours/hooks/use-page-help";
import {
  hasAnsweredTourOffer,
  rememberTourOfferAnswer,
} from "~/features/guided-tours/utilities/tour-offer-memory";
import { useWorkspace } from "~/shared/workspace/workspace-context";

const TOUR_OFFER_TOAST = "workspace-tour-offer";

/**
 * A one-time offer of the workspace tour, shown as a toast at the bottom
 * right of the overview. It never starts the tour itself, and once taken or
 * declined it does not come back; the tour stays behind the help icon.
 */
export function TourOffer() {
  const { platformSession } = useWorkspace();
  const userIdentifier = platformSession.user.id;
  const { tourName, startPageTour } = usePageHelp();
  // The latest way to start the tour, without offering the toast again.
  const startTourReference = useRef(startPageTour);
  startTourReference.current = startPageTour;

  useEffect(() => {
    if (tourName !== "workspace" || hasAnsweredTourOffer(userIdentifier)) {
      return;
    }
    // Leaving the overview withdraws the offer; it returns on the next visit.
    return offerChoice({
      identifier: TOUR_OFFER_TOAST,
      title: "New to HealthSchedule?",
      description:
        "A one-minute tour shows where things are. You can take it later from the help icon at the top of any page.",
      acceptLabel: "Show me around",
      onAccept: () => {
        rememberTourOfferAnswer(userIdentifier, "taken");
        // The toast closes, so focus moves to the help icon afterwards.
        void startTourReference.current({ returnFocusTo: findHelpButton });
      },
      declineLabel: "No thanks",
      onDecline: () => rememberTourOfferAnswer(userIdentifier, "declined"),
    });
  }, [tourName, userIdentifier]);

  return null;
}
