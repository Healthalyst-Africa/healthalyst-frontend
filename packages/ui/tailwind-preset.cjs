/* global module */

module.exports = {
  theme: {
    extend: {
      colors: {
        border: "oklch(var(--border) / <alpha-value>)",
        input: "oklch(var(--input) / <alpha-value>)",
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
          DEFAULT: "oklch(var(--brand-forest) / <alpha-value>)",
          mid: "oklch(var(--brand-forest-mid) / <alpha-value>)",
          deep: "oklch(var(--brand-forest-deep) / <alpha-value>)",
        },
        gold: {
          DEFAULT: "oklch(var(--brand-gold) / <alpha-value>)",
          light: "oklch(var(--brand-gold-light) / <alpha-value>)",
          subtle: "oklch(var(--brand-gold-subtle) / <alpha-value>)",
        },
        "accent-on-primary":
          "oklch(var(--brand-accent-on-primary) / <alpha-value>)",
        cream: {
          DEFAULT: "oklch(var(--brand-cream) / <alpha-value>)",
          dark: "oklch(var(--brand-cream-dark) / <alpha-value>)",
          light: "oklch(var(--brand-cream-light) / <alpha-value>)",
        },
        sand: {
          DEFAULT: "oklch(var(--brand-sand) / <alpha-value>)",
          dark: "oklch(var(--brand-sand-dark) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "oklch(var(--brand-ink) / <alpha-value>)",
          soft: "oklch(var(--brand-ink-soft) / <alpha-value>)",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "oklch(var(--sidebar-border) / <alpha-value>)",
          ring: "hsl(var(--sidebar-ring))",
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
};
