import { cn } from "@healthalyst/ui/lib/utilities";

type SectionHeadingProperties = {
  heading: string;
  description?: string;
  /** Lets the surrounding section reference the heading with `aria-labelledby`. */
  headingIdentifier?: string;
  className?: string;
};

/** A left-aligned heading and optional description that introduce a page section. */
export function SectionHeading({
  heading,
  description,
  headingIdentifier,
  className,
}: SectionHeadingProperties) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <h2
        id={headingIdentifier}
        className="font-serif text-xl font-normal leading-tight"
      >
        {heading}
      </h2>
      {description && (
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
