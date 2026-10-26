import { z as schemaLibrary } from "zod";

const subjectSchema = schemaLibrary.object({
  sub: schemaLibrary.string().uuid(),
});

/** Unverified metadata for cache isolation only. The APIs still verify and authorize tokens. */
export function readAccessTokenSubject(accessToken: string): string | null {
  const segments = accessToken.split(".");
  if (segments.length !== 3 || !segments[1]) return null;
  try {
    const encodedPayload = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const parsedPayload: unknown = JSON.parse(atob(encodedPayload));
    const subject = subjectSchema.safeParse(parsedPayload);
    return subject.success ? subject.data.sub : null;
  } catch {
    return null;
  }
}
