import {
  HERO_HEADING_LEAD,
  HERO_STILL_WORD,
  HERO_SPOKEN_ENDING,
  HERO_SLIDES,
} from "~/config/authentication-showcase";
import Image from "next/image";
import { RotatingPhotographPanel } from "@healthalyst/ui/components/rotating-photograph-panel";
import HealthAlystBrand from "~/components/ui/healthalyst-brand";

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
      wordClassName="text-gold-subtle"
    />
  );
}
