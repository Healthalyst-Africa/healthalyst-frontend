import { type ClassValue, clsx as combineClassNames } from "clsx";
import { twMerge as mergeTailwindClasses } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return mergeTailwindClasses(combineClassNames(inputs));
}
