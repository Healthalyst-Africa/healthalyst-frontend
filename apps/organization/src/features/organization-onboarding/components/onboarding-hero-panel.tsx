import Image from "next/image";
import { RotatingPhotographPanel } from "@healthalyst/ui/components/rotating-photograph-panel";
import HealthAlystBrand from "~/components/ui/healthalyst-brand";

/*
 * The heading, words and photographs of the HealthAlyst marketing website's
 * hero (`HOMEPAGE_HERO_CONTENT` in marketing-module), so onboarding opens
 * with the same introduction.
 */
const HERO_HEADING_LEAD = "Digital infrastructure for";
const HERO_STILL_WORD = "African healthcare";
const HERO_SPOKEN_ENDING =
  "hospitals, laboratories, pharmacies, dental practices, imaging centres and medical suppliers";

const HERO_SLIDES = [
  { word: "hospitals", source: "/images/module-hospital.webp" },
  { word: "laboratories", source: "/images/module-laboratory.webp" },
  { word: "pharmacies", source: "/images/module-pharmacy.webp" },
  { word: "dental practices", source: "/images/module-dental.webp" },
  { word: "imaging centres", source: "/images/module-imaging.webp" },
  { word: "medical suppliers", source: "/images/module-supply.webp" },
] as const;

const photographSlides = HERO_SLIDES.map((slide, slideIndex) => ({
  word: slide.word,
  photograph: (
    <Image
      alt=""
      className="object-cover"
      fill
      preload={slideIndex === 0}
      sizes="50vw"
      src={slide.source}
    />
  ),
}));

/** The onboarding panel: the marketing hero, with a line for this page. */
export default function OnboardingHeroPanel({ lede }: { lede: string }) {
  return (
    <RotatingPhotographPanel
      brand={
        <div className="rounded-lg bg-card p-1">
          <HealthAlystBrand />
        </div>
      }
      headingLead={HERO_HEADING_LEAD}
      spokenEnding={HERO_SPOKEN_ENDING}
      stillWord={HERO_STILL_WORD}
      slides={photographSlides}
      lede={<p>{lede}</p>}
      wordClassName="text-accent-on-primary"
    />
  );
}
