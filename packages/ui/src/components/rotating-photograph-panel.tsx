"use client";

import { useEffect, useState } from "react";
import { PauseIcon, PlayIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { cn } from "@healthalyst/ui/lib/utilities";

import type { RotatingPhotographPanelProperties } from "../types/photograph-panel";
export type { RotatingPhotographSlide } from "../types/photograph-panel";
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion";
import { PHOTOGRAPH_ROTATION_CONFIGURATION } from "../config/photograph-rotation";

/**
 * The marketing website's rotating hero, for a brand-coloured panel: a
 * photograph fills the panel behind a wash of the current primary colour,
 * deepest at the bottom where the heading sits, and every 3.6 seconds the
 * next one crossfades in with a slow zoom while the heading's last word
 * changes with it. The old word leaves before
 * the new one arrives, so they never overlap.
 *
 * Render it inside a positioned, isolated container with a rounded, clipped
 * edge; the photographs and wash fill that container behind the content,
 * which places `brand` at the top and the left-aligned heading and lede at
 * the bottom. The
 * photographs are decorative and the heading carries the full sentence for
 * screen readers. A pause control stops the rotation (WCAG 2.2.2); under
 * reduced motion the first photograph and `stillWord` stay still.
 */
export function RotatingPhotographPanel({
  headingLead,
  spokenEnding,
  stillWord,
  slides,
  brand,
  lede,
  wordClassName,
  pauseLabel = "Pause animation",
  playLabel = "Play animation",
}: RotatingPhotographPanelProperties) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isPaused, setIsPaused] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion || isPaused) {
      return;
    }

    const interval = window.setInterval(
      () =>
        setSlideIndex(
          (currentSlideIndex) => (currentSlideIndex + 1) % slides.length
        ),
      PHOTOGRAPH_ROTATION_CONFIGURATION.slideDurationMilliseconds
    );

    return () => window.clearInterval(interval);
  }, [prefersReducedMotion, isPaused, slides.length]);

  return (
    <>
      <div aria-hidden="true" className="absolute inset-0 -z-20">
        {slides.map((slide, candidateSlideIndex) => (
          <div
            key={slide.word}
            className={cn(
              "absolute inset-0 transition-[opacity,transform] ease-out motion-reduce:scale-100 motion-reduce:transition-none",
              candidateSlideIndex === slideIndex
                ? "scale-110 opacity-100"
                : "scale-100 opacity-0"
            )}
            style={{
              /* Fade in 1.2 s; the showing photograph zooms slowly over 7 s. */
              transitionDuration:
                candidateSlideIndex === slideIndex
                  ? PHOTOGRAPH_ROTATION_CONFIGURATION.activeTransitionDuration
                  : PHOTOGRAPH_ROTATION_CONFIGURATION.inactiveTransitionDuration,
            }}
          >
            {slide.photograph}
          </div>
        ))}
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,hsl(var(--primary)/0.94),hsl(var(--primary)/0.78)_40%,hsl(var(--primary)/0.5))]"
      />
      {!prefersReducedMotion && (
        <ActionButton
          type="button"
          variant="unstyled"
          size="unstyled"
          aria-label={isPaused ? playLabel : pauseLabel}
          onClick={() => setIsPaused(!isPaused)}
          className="absolute right-4 top-4 grid size-10 place-items-center rounded-full text-current opacity-80 hover:bg-primary-foreground/10 hover:opacity-100"
        >
          {isPaused ? (
            <PlayIcon aria-hidden="true" className="size-5" />
          ) : (
            <PauseIcon aria-hidden="true" className="size-5" />
          )}
        </ActionButton>
      )}
      <div className="flex size-full flex-col items-start justify-between gap-10 text-left">
        {brand ?? <span aria-hidden="true" />}
        <div className="flex flex-col gap-5">
          <p className="max-w-[18ch] text-balance font-serif text-[clamp(2rem,1rem+2.4vw,3.5rem)] font-normal leading-[1.08] tracking-[-0.01em]">
            {headingLead}
            <span className="sr-only"> {spokenEnding}</span>
            <span className={cn("block", wordClassName)}>
              {prefersReducedMotion ? (
                <span aria-hidden="true">{stillWord}</span>
              ) : (
                <span aria-hidden="true" className="inline-grid">
                  {slides.map((slide, candidateSlideIndex) => (
                    <span
                      key={slide.word}
                      className={cn(
                        "col-start-1 row-start-1 transition-[opacity,transform] ease-out",
                        candidateSlideIndex === slideIndex
                          ? "translate-y-0 opacity-100 delay-200 duration-500"
                          : candidateSlideIndex ===
                              (slideIndex + slides.length - 1) % slides.length
                            ? "-translate-y-3 opacity-0 duration-200"
                            : "translate-y-3 opacity-0 duration-200"
                      )}
                    >
                      {slide.word}
                    </span>
                  ))}
                </span>
              )}
            </span>
          </p>
          {lede && (
            <div className="max-w-[44ch] text-base leading-[1.6] opacity-90 xl:text-lg">
              {lede}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
