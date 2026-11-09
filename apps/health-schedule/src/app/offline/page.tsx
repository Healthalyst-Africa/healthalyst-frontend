import type { Metadata } from "next";
import Image from "next/image";
import { OfflinePage } from "@healthalyst/ui/components/offline-page";

export const metadata: Metadata = {
  title: { absolute: "You are offline | HealthAlyst" },
  robots: { index: false, follow: false },
};

/** Stored by the service worker and shown when a page cannot load offline. */
export default function OfflineRoute() {
  return (
    <OfflinePage
      brand={
        <Image
          src="/logo.jpg"
          alt="HealthAlyst Africa"
          width={1024}
          height={1023}
          sizes="56px"
          // Loaded directly, since the image optimiser needs the server.
          unoptimized
          className="size-14 object-contain"
        />
      }
      // A full page load, so the browser tries the network again.
      action={<a href="/">Try again</a>}
    />
  );
}
