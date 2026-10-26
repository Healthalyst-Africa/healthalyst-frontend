import type { Config as TailwindConfiguration } from "tailwindcss";

const tailwindConfiguration = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  presets: [require("@healthalyst/ui/tailwind-preset")],
  plugins: [require("tailwindcss-animate")],
} satisfies TailwindConfiguration;

export default tailwindConfiguration;
