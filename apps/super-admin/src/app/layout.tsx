import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Young_Serif } from "next/font/google";
import "@healthalyst/ui/styles.css";
import "./globals.css";
import { ApplicationQueryProvider } from "~/infrastructure/query/query-provider";
import { StaffSessionProvider } from "~/infrastructure/auth/staff-session-provider";

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
  title: "HealthAlyst Super Admin",
  description: "Internal HealthAlyst organisation oversight.",
  robots: { index: false, follow: false },
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
        </ApplicationQueryProvider>
      </body>
    </html>
  );
}
