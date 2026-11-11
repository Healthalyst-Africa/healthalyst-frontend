/**
 * How this app installs and behaves offline. HealthSchedule keeps its screens so it opens and moves between them without a connection.
 */
export const WEB_APP_CONFIGURATION = {
  identifier: "/?product=healthschedule",
  name: "HealthSchedule",
  shortName: "HealthSchedule",
  description:
    "Patient scheduling and clinical operations for hospitals and clinics, part of HealthAlyst.",
  /** Brand green; also the browser and title bar colour when installed. */
  themeColour: "#145A46",
  backgroundColour: "#FFFFFF",
  offlinePagePath: "/offline",
  /** Plain HTML with no JavaScript, so it works whatever failed to load. */
  offlinePage: {
    title: "You are offline",
    description:
      "This screen has not been opened on this device yet, so it needs a connection. Screens you have already opened still work offline.",
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
  promptToInstall: true,
  keepPagesForOffline: true,
} as const;
