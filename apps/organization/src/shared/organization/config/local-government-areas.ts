/** Where an organisation's local government area (LGA) choices come from. */
export const LOCAL_GOVERNMENT_AREA_CONFIGURATION = {
  /** `GET /v1/reference/states/{code}/lgas`: the state's LGAs, officially spelled. */
  endpoint: (stateCode: string) =>
    `/v1/reference/states/${encodeURIComponent(stateCode)}/lgas`,
  queryNamespace: "platform-reference",
  /** The list changes only with a backend release. */
  staleTimeMilliseconds: 24 * 60 * 60 * 1000,
  /** A safe read, so a dropped connection is tried again before showing an error. */
  retryCount: 2,
} as const;

export const LOCAL_GOVERNMENT_AREA_FIELD_TEXT = {
  label: "Local government area",
  chooseStateFirst: "Select the state first",
  loading: "Loading local government areas",
  choose: "Select the local government area",
  loadFailedTitle: "Local government areas did not load",
  loadFailed:
    "Check your connection and try again. You can also leave this field empty for now.",
  retry: "Try again",
} as const;
