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
        gold: {
          DEFAULT: "oklch(var(--brand-gold) / <alpha-value>)",
          subtle: "oklch(var(--brand-gold-subtle) / <alpha-value>)",
        },
        status: {
          neutral: "var(--status-neutral)",
          information: "var(--status-information)",
          warning: "var(--status-warning)",
          highlight: "var(--status-highlight)",
          positive: "var(--status-positive)",
          negative: "var(--status-negative)",
        },
        alert: {
          "information-surface": "var(--alert-information-surface)",
          "information-border": "var(--alert-information-border)",
          "success-surface": "var(--alert-success-surface)",
          "success-border": "var(--alert-success-border)",
          "warning-surface": "var(--alert-warning-surface)",
          "warning-border": "var(--alert-warning-border)",
          "error-surface": "var(--alert-error-surface)",
          "error-border": "var(--alert-error-border)",
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
      borderColor: {
        DEFAULT: "oklch(var(--border))",
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
