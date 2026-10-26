import Image from "next/image";
import { RotatingPhotographPanel } from "@healthalyst/ui/components/rotating-photograph-panel";

const COMPANY_WORKSPACE_SLIDES = [
  {
    word: "organisation oversight",
    source: "/images/healthcare-collaboration.webp",
  },
  { word: "application reviews", source: "/images/clinical-team.webp" },
  { word: "access decisions", source: "/images/clinician-tablet.webp" },
] as const;

const photographSlides = COMPANY_WORKSPACE_SLIDES.map((slide, slideIndex) => ({
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

export function StaffAuthBrand() {
  return (
    <Image
      alt="HealthAlyst Africa"
      className="size-16 object-contain"
      height={1023}
      sizes="64px"
      src="/logo.jpg"
      width={1024}
    />
  );
}

export function StaffAuthShowcase() {
  return (
    <RotatingPhotographPanel
      brand={
        <div className="rounded-lg bg-card p-1">
          <StaffAuthBrand />
        </div>
      }
      headingLead="Company workspace for"
      spokenEnding="organisation oversight, application reviews and access decisions"
      stillWord="organisation oversight"
      slides={photographSlides}
      lede={
        <p>
          HealthAlyst staff review organisation registrations, follow
          application status and record access decisions.
        </p>
      }
      wordClassName="text-gold-subtle"
    />
  );
}
