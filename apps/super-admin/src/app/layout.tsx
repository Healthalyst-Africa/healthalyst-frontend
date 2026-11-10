import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Young_Serif } from "next/font/google";
import "@healthalyst/ui/styles.css";
import "./globals.css";
import { ApplicationQueryProvider } from "~/infrastructure/query/query-provider";
import { StaffSessionProvider } from "~/infrastructure/auth/staff-session-provider";
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
  title: "HealthAlyst Super Admin",
  description: "Internal HealthAlyst organisation oversight.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: WEB_APP_CONFIGURATION.themeColour,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${serifFont.variable} ${sansSerifFont.variable}`}
    >
      <body className={sansSerifFont.className}>
        <ApplicationQueryProvider>
          <StaffSessionProvider>{children}</StaffSessionProvider>
          <AppStatus />
        </ApplicationQueryProvider>
      </body>
    </html>
  );
}
