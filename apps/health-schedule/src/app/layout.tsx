import type { Metadata } from "next";
import type React from "react";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import "@healthalyst/ui/styles.css";
import "./globals.css";

const serifFont = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const sansSerifFont = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HealthAlyst | Organisation onboarding",
  description:
    "Register your healthcare organisation and request access to HealthSchedule.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${serifFont.variable} ${sansSerifFont.variable}`}
    >
      <body className={sansSerifFont.className}>{children}</body>
    </html>
  );
}
