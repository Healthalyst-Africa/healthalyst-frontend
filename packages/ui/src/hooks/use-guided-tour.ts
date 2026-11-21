"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Driver } from "driver.js";
import "driver.js/dist/driver.css";
import type {
  GuidedTourEnding,
  GuidedTourStep,
} from "@healthalyst/ui/types/guided-tour";

type StartGuidedTourOptions = {
  steps: readonly GuidedTourStep[];
  /** Runs once when the tour ends, however it ends. */
  onEnd?: (ending: GuidedTourEnding) => void;
  /**
   * Where focus goes when the tour ends, if not back to what started it,
   * such as when the starting button disappears.
   */
  returnFocusTo?: () => HTMLElement | null;
};

const POPOVER_CLASS_NAME = "guided-tour-popover";

/** Whether an element is on the page and visible, so a step can point at it. */
function isVisible(selector: string): boolean {
  const element = document.querySelector(selector);
  if (!element) return false;
  const bounds = element.getBoundingClientRect();
  return bounds.width > 0 && bounds.height > 0;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Short guided tours that point at parts of a page. A tour starts only when
 * asked, never on its own. Steps whose element is missing or hidden, such
 * as a page a role cannot see or a sidebar folded away on a phone, are
 * skipped. Escape, the close button or a click outside ends it at once,
 * and focus returns to whatever started it.
 */
export function useGuidedTour() {
  const activeTour = useRef<Driver | null>(null);

  useEffect(
    () => () => {
      activeTour.current?.destroy();
      activeTour.current = null;
    },
    []
  );

  /** Starts a tour. Returns false when none of its steps can be shown. */
  const startTour = useCallback(
    async ({
      steps,
      onEnd,
      returnFocusTo: findFocusTarget,
    }: StartGuidedTourOptions): Promise<boolean> => {
      const visibleSteps = steps.filter(
        (step) => !step.element || isVisible(step.element)
      );
      if (visibleSteps.length === 0) return false;

      const startedFrom =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      const { driver } = await import("driver.js");
      const reducedMotion = prefersReducedMotion();

      activeTour.current?.destroy();
      const tour = driver({
        steps: visibleSteps.map((step) => ({
          ...(step.element && { element: step.element }),
          popover: {
            title: step.title,
            description: step.description,
            ...(step.placement && { side: step.placement, align: "start" }),
          },
        })),
        animate: !reducedMotion,
        smoothScroll: !reducedMotion,
        allowClose: true,
        allowKeyboardControl: true,
        overlayClickBehavior: "close",
        overlayOpacity: 0.45,
        stagePadding: 6,
        stageRadius: 10,
        disableActiveInteraction: true,
        popoverClass: POPOVER_CLASS_NAME,
        showProgress: visibleSteps.length > 1,
        progressText: "{{current}} of {{total}}",
        nextBtnText: "Next",
        prevBtnText: "Back",
        doneBtnText: "Done",
        showButtons: ["next", "previous", "close"],
        onDestroyed: (_element, _step, { reason }) => {
          activeTour.current = null;
          const focusTarget =
            findFocusTarget?.() ??
            (startedFrom?.isConnected ? startedFrom : null);
          focusTarget?.focus();
          onEnd?.(reason === "done" ? "finished" : "closed");
        },
      });
      activeTour.current = tour;
      tour.drive();
      return true;
    },
    []
  );

  return { startTour };
}
