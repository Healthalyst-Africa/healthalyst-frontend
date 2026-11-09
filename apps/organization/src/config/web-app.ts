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
  keepPagesForOffline: false,
} as const;
