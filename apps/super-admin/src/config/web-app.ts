/**
 * How this app installs and behaves offline. The staff app needs a connection and keeps no data on the device.
 */
export const WEB_APP_CONFIGURATION = {
  identifier: "/?product=super-admin",
  name: "HealthAlyst Super Admin",
  shortName: "Super Admin",
  description:
    "The HealthAlyst staff workspace for reviewing and managing organisations.",
  /** Brand green; also the browser and title bar colour when installed. */
  themeColour: "#145A46",
  backgroundColour: "#FFFFFF",
  offlinePagePath: "/offline",
  keepPagesForOffline: false,
} as const;
