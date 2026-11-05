import { describe, expect, it } from "vitest";
import {
  partnerInvitationFormSchema,
  partnershipAcceptanceFormSchema,
  partnershipRequestFormSchema,
} from "~/features/partner-network/schemas/partner-network-schemas";
import {
  getAvailablePartnershipActions,
  isAwaitingOurReply,
  sortPartnerships,
} from "~/features/partner-network/utilities/partnership-actions";

describe("partnership actions", () => {
  it("lets only the provider accept or decline a request", () => {
    expect(
      getAvailablePartnershipActions({
        direction: "INCOMING",
        status: "PENDING",
      })
    ).toEqual(["accept", "decline"]);
    expect(
      getAvailablePartnershipActions({
        direction: "OUTGOING",
        status: "PENDING",
      })
    ).toEqual(["set-preference", "cancel-request"]);
  });

  it("lets either side pause or end an active partnership", () => {
    expect(
      getAvailablePartnershipActions({
        direction: "INCOMING",
        status: "ACTIVE",
      })
    ).toEqual(["suspend", "terminate"]);
    expect(
      getAvailablePartnershipActions({
        direction: "OUTGOING",
        status: "ACTIVE",
      })
    ).toEqual(["set-preference", "suspend", "terminate"]);
  });

  it("lets only the provider resume a paused partnership", () => {
    expect(
      getAvailablePartnershipActions({
        direction: "INCOMING",
        status: "SUSPENDED",
      })
    ).toContain("resume");
    expect(
      getAvailablePartnershipActions({
        direction: "OUTGOING",
        status: "SUSPENDED",
      })
    ).not.toContain("resume");
  });

  it("offers nothing once a partnership ended or was declined", () => {
    expect(
      getAvailablePartnershipActions({
        direction: "INCOMING",
        status: "TERMINATED",
      })
    ).toEqual([]);
    expect(
      getAvailablePartnershipActions({
        direction: "OUTGOING",
        status: "DECLINED",
      })
    ).toEqual([]);
  });

  it("separates requests waiting for an answer", () => {
    expect(
      isAwaitingOurReply({ direction: "INCOMING", status: "PENDING" })
    ).toBe(true);
    expect(
      isAwaitingOurReply({ direction: "OUTGOING", status: "PENDING" })
    ).toBe(false);
  });

  it("lists active, preferred and higher-priority partners first", () => {
    const partner = (name: string) => ({
      id: name,
      name,
      type: null,
      stateCode: null,
    });
    const sorted = sortPartnerships([
      {
        partner: partner("Ended"),
        status: "TERMINATED",
        isPreferred: true,
        priority: 1,
      },
      {
        partner: partner("Later"),
        status: "ACTIVE",
        isPreferred: false,
        priority: 50,
      },
      {
        partner: partner("Sooner"),
        status: "ACTIVE",
        isPreferred: false,
        priority: 10,
      },
      {
        partner: partner("Preferred"),
        status: "ACTIVE",
        isPreferred: true,
        priority: 900,
      },
    ] as const);
    expect(sorted.map((item) => item.partner.name)).toEqual([
      "Preferred",
      "Sooner",
      "Later",
      "Ended",
    ]);
  });
});

describe("partner forms", () => {
  it("needs a service and a priority from 1 to 1000", () => {
    const result = partnershipRequestFormSchema.safeParse({
      serviceCategory: "",
      priority: "0",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual([
      "serviceCategory",
      "priority",
    ]);
    expect(
      partnershipRequestFormSchema.parse({
        serviceCategory: "LABORATORY",
        priority: "20",
        isPreferred: "on",
      })
    ).toEqual({
      serviceCategory: "LABORATORY",
      priority: 20,
      isPreferred: true,
    });
  });

  it("needs the data-sharing agreement ticked to accept", () => {
    expect(partnershipAcceptanceFormSchema.safeParse({}).success).toBe(false);
    expect(
      partnershipAcceptanceFormSchema.safeParse({ agreementAccepted: "on" })
        .success
    ).toBe(true);
  });

  it("turns a Nigerian phone number into international form", () => {
    const result = partnerInvitationFormSchema.parse({
      partnerName: "Lagos Labs",
      email: "admin@lagoslabs.example",
      phone: "0803 123 4567",
      partnerType: "LABORATORY",
      serviceCategory: "LABORATORY",
      accessLevel: "L0_CONTACT",
    });
    expect(result.phone).toBe("+2348031234567");
  });

  it("leaves an empty phone number out", () => {
    const result = partnerInvitationFormSchema.parse({
      partnerName: "Lagos Labs",
      email: "admin@lagoslabs.example",
      phone: "",
      partnerType: "LABORATORY",
      serviceCategory: "LABORATORY",
      accessLevel: "L1_PORTAL_LITE",
    });
    expect(result.phone).toBeUndefined();
  });
});
