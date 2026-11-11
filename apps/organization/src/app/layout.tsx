import type { Metadata, Viewport } from "next";
import type React from "react";
import { Inter, Young_Serif } from "next/font/google";
import "@healthalyst/ui/styles.css";
import "./globals.css";
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
  // Phone numbers stay plain text unless a page links them on purpose.
  formatDetection: { telephone: false },
  // Each page names itself, so the browser tab says where the person is.
  title: { default: "HealthAlyst", template: "%s | HealthAlyst" },
  description:
    "Register your healthcare organisation, sign in, and manage access to HealthAlyst products.",
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
          <AppStatus />
        </ApplicationQueryProvider>
      </body>
    </html>
  );
}
