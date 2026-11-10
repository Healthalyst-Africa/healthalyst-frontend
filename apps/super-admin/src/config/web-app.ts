/**
 * Super Admin is browser-only: it cannot be installed, but keeps a service
 * worker for its offline page and notices. It keeps no data on the device.
 */
export const WEB_APP_CONFIGURATION = {
  name: "HealthAlyst Super Admin",
  /** Brand green; the browser's toolbar colour where it supports one. */
  themeColour: "#145A46",
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
