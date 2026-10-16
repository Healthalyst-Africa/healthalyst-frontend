import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import "@healthalyst/ui/styles.css";
import "./globals.css";
import { ApplicationQueryProvider } from "~/infrastructure/query/query-provider";
import { StaffSessionProvider } from "~/features/staff-auth/context/staff-session-provider";

const serifFont = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const sansSerifFont = Source_Sans_3({
  subsets: ["latin"],
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
