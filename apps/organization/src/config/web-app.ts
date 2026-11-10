/**
 * How this app installs and behaves offline. The organisation hub needs a connection and keeps no data on the device.
 */
export const WEB_APP_CONFIGURATION = {
  identifier: "/?product=organisation",
  name: "HealthAlyst organisation",
  shortName: "HealthAlyst",
  description:
    "Manage your organisation, team, partners and products on HealthAlyst.",
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
  /**
   * Suggest installing to the home screen. iPhones never prompt by themselves,
   * and clear an uninstalled site's stored data after about a week unused.
   */
  promptToInstall: false,
  keepPagesForOffline: false,
} as const;
