import { describe, expect, it } from "vitest";
import { getAvailableLifecycleActions } from "~/features/organization-oversight/hooks/use-organization-lifecycle";
import {
  internalNoteSchema,
  lifecycleReasonSchema,
} from "~/features/organization-oversight/schemas/organization-lifecycle-schemas";
import { describeOrganizationHistory } from "~/features/organization-oversight/utilities/describe-organization-history";

describe("getAvailableLifecycleActions", () => {
  it("lets a Super Admin suspend or deactivate an active organisation", () => {
    expect(getAvailableLifecycleActions("ACTIVE", ["SUPER_ADMIN"])).toEqual([
      "suspend",
      "deactivate",
    ]);
  });

  it("lets a Super Admin reinstate or deactivate a suspended organisation", () => {
    expect(getAvailableLifecycleActions("SUSPENDED", ["SUPER_ADMIN"])).toEqual([
      "reinstate",
      "deactivate",
    ]);
  });

  it("keeps deactivation to Super Admins", () => {
    expect(getAvailableLifecycleActions("ACTIVE", ["PLATFORM_ADMIN"])).toEqual([
      "suspend",
    ]);
  });

  it("offers nothing to roles the API does not accept", () => {
    expect(
      getAvailableLifecycleActions("ACTIVE", ["COMPLIANCE_REVIEWER"])
    ).toEqual([]);
  });

  it("offers nothing for applications or closed organisations", () => {
    for (const status of [
      "PENDING_VERIFICATION",
      "UNDER_REVIEW",
      "REJECTED",
      "DEACTIVATED",
    ] as const) {
      expect(getAvailableLifecycleActions(status, ["SUPER_ADMIN"])).toEqual([]);
    }
  });
});

describe("lifecycleReasonSchema", () => {
  it("needs at least 5 characters after trimming", () => {
    expect(lifecycleReasonSchema.safeParse({ reason: "  abc  " }).success).toBe(
      false
    );
    expect(
      lifecycleReasonSchema.safeParse({ reason: "Licence expired" }).success
    ).toBe(true);
  });

  it("refuses more than 2,000 characters", () => {
    expect(
      lifecycleReasonSchema.safeParse({ reason: "a".repeat(2001) }).success
    ).toBe(false);
  });
});

describe("internalNoteSchema", () => {
  it("refuses an empty note", () => {
    expect(internalNoteSchema.safeParse({ note: "   " }).success).toBe(false);
  });

  it("accepts a note up to 2,000 characters", () => {
    expect(
      internalNoteSchema.safeParse({ note: "a".repeat(2000) }).success
    ).toBe(true);
  });
});

describe("describeOrganizationHistory", () => {
  const baseEntry = {
    actorId: "6f1c3e1e-3d2b-4b8e-9c55-0a1b2c3d4e5f",
    reasonCode: null,
    message: null,
    internalNote: null,
  };

  it("titles a note by itself rather than by the unchanged status", () => {
    const [entry] = describeOrganizationHistory([
      {
        ...baseEntry,
        fromStatus: "ACTIVE",
        toStatus: "ACTIVE",
        internalNote: "Called the owner.",
        createdAt: "2026-11-04T10:56:00.000Z",
      },
    ]);
    expect(entry).toMatchObject({
      title: "Internal note",
      details: [{ label: "Note", value: "Called the owner." }],
    });
  });

  it("calls a status change's only text its reason, whichever field holds it", () => {
    const [reinstated, suspended] = describeOrganizationHistory([
      {
        ...baseEntry,
        fromStatus: "ACTIVE",
        toStatus: "SUSPENDED",
        message: "Licence expired.",
        createdAt: "2026-11-04T10:56:00.000Z",
      },
      {
        ...baseEntry,
        fromStatus: "SUSPENDED",
        toStatus: "ACTIVE",
        internalNote: "Licence renewed.",
        createdAt: "2026-11-04T10:57:00.000Z",
      },
    ]);
    expect(reinstated).toMatchObject({
      title: "Active",
      details: [{ label: "Reason", value: "Licence renewed." }],
    });
    expect(suspended).toMatchObject({
      title: "Suspended",
      details: [{ label: "Reason", value: "Licence expired." }],
    });
  });

  it("keeps a reason and an internal note apart when both are recorded", () => {
    const [entry] = describeOrganizationHistory([
      {
        ...baseEntry,
        fromStatus: "UNDER_REVIEW",
        toStatus: "ACTIVE",
        message: "All checks passed.",
        internalNote: "Fast-tracked.",
        createdAt: "2026-10-29T21:17:00.000Z",
      },
    ]);
    expect(entry?.details).toEqual([
      { label: "Reason", value: "All checks passed." },
      { label: "Internal note", value: "Fast-tracked." },
    ]);
  });
});
