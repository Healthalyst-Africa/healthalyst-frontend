import type { Metadata, Viewport } from "next";
import type React from "react";
import { Inter, Young_Serif } from "next/font/google";
import "@healthalyst/ui/styles.css";
import "./globals.css";
import { ToastRegion } from "@healthalyst/ui/components/toast-region";
import { PlatformSessionProvider } from "~/infrastructure/auth/platform-session-provider";
import { ApplicationQueryProvider } from "~/infrastructure/query/query-provider";
import { WEB_APP_CONFIGURATION } from "~/config/web-app";
import { AppStatus } from "~/infrastructure/pwa/app-status";

// Young Serif for headings. It has one weight, already heavy, so headings use
// `font-normal`.
const serifFont = Young_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
  display: "swap",
});

// Inter for all other text; its optical-size axis tightens larger sizes.
const sansSerifFont = Inter({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: WEB_APP_CONFIGURATION.name,
  appleWebApp: {
    capable: true,
    title: WEB_APP_CONFIGURATION.shortName,
    statusBarStyle: "default",
  },
  icons: { apple: "/icons/apple-touch-icon.png" },
  // Phone numbers stay plain text unless a page links them on purpose.
  formatDetection: { telephone: false },
  title: "HealthSchedule | HealthAlyst",
  description:
    "Patient scheduling and clinical operations for hospitals and clinics, part of HealthAlyst.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: WEB_APP_CONFIGURATION.themeColour,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${serifFont.variable} ${sansSerifFont.variable}`}
    >
      <body className={sansSerifFont.className}>
        <ApplicationQueryProvider>
          <PlatformSessionProvider>{children}</PlatformSessionProvider>
          <ToastRegion />
          <AppStatus />
        </ApplicationQueryProvider>
      </body>
    </html>
  );
}
