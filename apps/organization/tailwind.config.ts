import type { Config as TailwindConfiguration } from "tailwindcss";

const tailwindConfiguration = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        forest: {
          DEFAULT: "rgb(var(--brand-forest) / <alpha-value>)",
          mid: "rgb(var(--brand-forest-mid) / <alpha-value>)",
          deep: "rgb(var(--brand-forest-deep) / <alpha-value>)",
        },
        gold: {
          DEFAULT: "rgb(var(--brand-gold) / <alpha-value>)",
          light: "rgb(var(--brand-gold-light) / <alpha-value>)",
          subtle: "rgb(var(--brand-gold-subtle) / <alpha-value>)",
        },
        "accent-on-primary":
          "rgb(var(--brand-accent-on-primary) / <alpha-value>)",
        cream: {
          DEFAULT: "rgb(var(--brand-cream) / <alpha-value>)",
          dark: "rgb(var(--brand-cream-dark) / <alpha-value>)",
          light: "rgb(var(--brand-cream-light) / <alpha-value>)",
        },
        sand: {
          DEFAULT: "rgb(var(--brand-sand) / <alpha-value>)",
          dark: "rgb(var(--brand-sand-dark) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--brand-ink) / <alpha-value>)",
          soft: "rgb(var(--brand-ink-soft) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-sans)"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // The blinking caret in the one-time code input (`input-otp`).
      keyframes: {
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
      },
      animation: {
        "caret-blink": "caret-blink 1.25s ease-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies TailwindConfiguration;

export default tailwindConfiguration;
