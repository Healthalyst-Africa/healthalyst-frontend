import type { z } from "zod";
import { UNEXPECTED_TEAM_RESPONSE } from "~/features/team-management/config/team-management";

/** Check a team response against its contract before anyone sees it. */
export function parseTeamResponse<Schema extends z.ZodType>(
  schema: Schema,
  responseData: unknown
): z.output<Schema> {
  const parsedResponse = schema.safeParse(responseData);
  if (!parsedResponse.success) throw new Error(UNEXPECTED_TEAM_RESPONSE);
  return parsedResponse.data;
}

/** A path segment for an identifier from a list or the address bar. */
export function encodeIdentifier(identifier: string): string {
  return encodeURIComponent(identifier);
}
