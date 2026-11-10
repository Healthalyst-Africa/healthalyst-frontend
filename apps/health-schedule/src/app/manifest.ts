import type { MetadataRoute } from "next";
import { createWebAppManifest } from "@healthalyst/pwa/web-app-manifest";
import { WEB_APP_CONFIGURATION } from "~/config/web-app";

export default function manifest(): MetadataRoute.Manifest {
  return createWebAppManifest(WEB_APP_CONFIGURATION);
}
