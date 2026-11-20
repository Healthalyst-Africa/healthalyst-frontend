"use client";

import { useEffect, useState } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { findHelpButton } from "~/features/guided-tours/components/page-help-button";
import { usePageHelp } from "~/features/guided-tours/hooks/use-page-help";
import {
  hasAnsweredTourOffer,
  rememberTourOfferAnswer,
} from "~/features/guided-tours/utilities/tour-offer-memory";
import { useWorkspace } from "~/shared/workspace/workspace-context";

/**
 * A one-time offer of the workspace tour. It never starts the tour itself,
 * and once taken or declined it does not come back; the tour stays in the
 * account menu.
 */
export function TourOffer() {
  const { platformSession } = useWorkspace();
  const userIdentifier = platformSession.user.id;
  const { tourName, startPageTour } = usePageHelp();
  const [isOffered, setIsOffered] = useState(false);

  // Storage is read after the page has rendered, so the offer never flickers in.
  useEffect(() => {
    setIsOffered(!hasAnsweredTourOffer(userIdentifier));
  }, [userIdentifier]);

  if (!isOffered || tourName !== "workspace") return null;

  function answer(response: "taken" | "declined") {
    rememberTourOfferAnswer(userIdentifier, response);
    setIsOffered(false);
  }

  return (
    <NoticeBanner
      tone="information"
      title="New to HealthSchedule?"
      action={
        <div className="flex flex-wrap gap-2">
          <ActionButton
            type="button"
            size="compact"
            onClick={() => {
              answer("taken");
              // The offer disappears, so focus moves to the help button,
              // where the tour can be taken again.
              void startPageTour({ returnFocusTo: findHelpButton });
            }}
          >
            Show me around
          </ActionButton>
          <ActionButton
            type="button"
            size="compact"
            variant="ghost"
            onClick={() => answer("declined")}
          >
            No thanks
          </ActionButton>
        </div>
      }
    >
      A one-minute tour shows where things are. You can take it later from your
      account menu.
    </NoticeBanner>
  );
}
