import { describe, expect, it } from "vitest";
import {
  auditFilterFormSchema,
  toAuditBoundary,
} from "~/features/audit-log/schemas/audit-log-schemas";

const EMPTY_FILTERS = {
  organizationId: "",
  actorUserId: "",
  action: "",
  fromDay: "",
  toDay: "",
};

describe("audit log filters", () => {
  it("accepts an exact action and a prefix ending in a dot", () => {
    for (const action of ["organization.approved", "auth.", "Auth.Sign_In"]) {
      expect(
        auditFilterFormSchema.safeParse({ ...EMPTY_FILTERS, action }).success
      ).toBe(true);
    }
  });

  it("refuses actions the API would reject", () => {
    for (const action of ["organization approved", ".auth", "auth..x"]) {
      expect(
        auditFilterFormSchema.safeParse({ ...EMPTY_FILTERS, action }).success
      ).toBe(false);
    }
  });

  it("refuses an end date before the start date", () => {
    const result = auditFilterFormSchema.safeParse({
      ...EMPTY_FILTERS,
      fromDay: "2026-03-10",
      toDay: "2026-03-09",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["toDay"]);
  });

  it("refuses more than 366 days at once", () => {
    expect(
      auditFilterFormSchema.safeParse({
        ...EMPTY_FILTERS,
        fromDay: "2025-01-01",
        toDay: "2026-03-01",
      }).success
    ).toBe(false);
  });

  it("covers whole Lagos days", () => {
    expect(toAuditBoundary("2026-03-10", "start")).toBe(
      "2026-03-10T00:00:00.000+01:00"
    );
    expect(toAuditBoundary("2026-03-10", "end")).toBe(
      "2026-03-10T23:59:59.999+01:00"
    );
  });
});
