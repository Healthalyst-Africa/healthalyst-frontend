import { describe, expect, it } from "vitest";
import type { RecordSensitivity } from "~/features/sensitive-records/schemas/sensitive-record-response-schemas";
import {
  canSeeClinicalHistory,
  resolveRecordAccess,
} from "~/features/sensitive-records/utilities/record-access";

function sensitivity(changes: Partial<RecordSensitivity>): RecordSensitivity {
  return {
    restricted: true,
    access: "NONE",
    accessUntil: null,
    labels: null,
    ...changes,
  };
}

describe("record access", () => {
  it("opens a record that is not restricted", () => {
    const access = resolveRecordAccess(
      sensitivity({ restricted: false, access: "NOT_RESTRICTED", labels: [] }),
      []
    );
    expect(access).toEqual({ state: "open" });
    expect(canSeeClinicalHistory(access)).toBe(true);
  });

  it("opens a restricted record to the care team and during emergency access", () => {
    expect(
      resolveRecordAccess(sensitivity({ access: "CARE_TEAM" }), [])
    ).toEqual({
      state: "care-team",
    });
    const emergency = resolveRecordAccess(
      sensitivity({
        access: "BREAK_GLASS",
        accessUntil: "2026-11-20T16:00:00Z",
      }),
      []
    );
    expect(emergency).toEqual({
      state: "emergency-access",
      until: "2026-11-20T16:00:00Z",
    });
    expect(canSeeClinicalHistory(emergency)).toBe(true);
  });

  it("locks a restricted record, offering emergency access to clinical staff", () => {
    const clinician = resolveRecordAccess(sensitivity({}), ["triage:record"]);
    expect(clinician).toEqual({ state: "locked-can-open" });
    expect(canSeeClinicalHistory(clinician)).toBe(false);
    expect(resolveRecordAccess(sensitivity({}), ["patient:read"])).toEqual({
      state: "locked",
    });
  });
});
