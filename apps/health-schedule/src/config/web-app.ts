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
  keepPagesForOffline: true,
} as const;
