import { type ClassValue, clsx as combineClassNames } from "clsx";
import { extendTailwindMerge as extendClassMerging } from "tailwind-merge";

/** The purpose-based text sizes from the shared Tailwind preset. */
const PURPOSE_TEXT_SIZES = [
  "display",
  "title",
  "heading",
  "lede",
  "body",
  "support",
  "caption",
] as const;

// Without this, "text-lede" would be taken for a colour and dropped beside
// "text-muted-foreground".
const mergeTailwindClasses = extendClassMerging({
  extend: { classGroups: { "font-size": [{ text: [...PURPOSE_TEXT_SIZES] }] } },
});

export function cn(...inputs: ClassValue[]) {
  return mergeTailwindClasses(combineClassNames(inputs));
}
