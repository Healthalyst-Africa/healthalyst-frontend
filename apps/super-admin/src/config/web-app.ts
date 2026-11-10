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
  /** Plain HTML with no JavaScript, so it works whatever failed to load. */
  offlinePage: {
    title: "You are offline",
    description:
      "This page needs a connection. Check your Wi-Fi or mobile data, then try again.",
    retryLabel: "Try again",
    colours: {
      primary: "#145A46",
      onPrimary: "#FFFFFF",
      text: "#112C23",
      secondaryText: "#40584E",
      background: "#FFFFFF",
    },
  },
  keepPagesForOffline: false,
} as const;
