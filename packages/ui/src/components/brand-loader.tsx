import type { CSSProperties } from "react";
import { cn } from "@healthalyst/ui/lib/utilities";

type BrandLoaderProperties = {
  /** A transparent image of the brand mark; its shape is filled with gold. */
  markSource: string;
  /** Announced to assistive technology; never shown. */
  label?: string;
  /** `screen` fills the viewport for page loads; `inline` sits in content. */
  presentation?: "screen" | "inline";
  className?: string;
};

/**
 * An animated brand mark for loading states. Gold rises through the mark and
 * drains away in a loop, with a soft halo; reduced motion shows it still.
 */
export function BrandLoader({
  markSource,
  label = "Loading",
  presentation = "screen",
  className,
}: BrandLoaderProperties) {
  const markMask: CSSProperties = {
    maskImage: `url(${markSource})`,
    WebkitMaskImage: `url(${markSource})`,
    maskSize: "contain",
    WebkitMaskSize: "contain",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskPosition: "center",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center justify-center motion-safe:animate-brand-appear",
        presentation === "screen" && "min-h-dvh w-full bg-card",
        presentation === "inline" && "py-16",
        className
      )}
    >
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" className="relative size-20">
        <span className="absolute -inset-6 rounded-full bg-[radial-gradient(circle,oklch(var(--brand-gold)/0.35),transparent_70%)] motion-safe:animate-brand-halo motion-reduce:hidden" />
        <span
          className="absolute inset-0 bg-gold/20 motion-reduce:hidden"
          style={markMask}
        />
        <span
          className="absolute inset-0 bg-gold motion-safe:animate-brand-fill"
          style={markMask}
        />
      </span>
    </div>
  );
}

export type { BrandLoaderProperties };
