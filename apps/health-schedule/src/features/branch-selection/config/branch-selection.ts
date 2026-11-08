/** Platform API list of the organisation's branches. */
export const BRANCHES_ENDPOINT = "/v1/organization/branches";

/** The Platform API permission needed to list branches. */
export const BRANCH_READ_PERMISSION = "branch:read";

/** The Platform API's branch scope for people who work at every branch. */
export const ALL_BRANCHES_SCOPE = "*";

/** Browser storage name for the branch a person last chose, per organisation. */
export const REMEMBERED_BRANCH_STORAGE_PREFIX = "healthschedule-branch";
