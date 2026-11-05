import { describe, expect, it } from "vitest";
import { ownerAssignmentFormSchema } from "~/features/organization-oversight/schemas/organization-lifecycle-schemas";

describe("owner recovery", () => {
  it("needs a member, a verification note and confirmation", () => {
    const result = ownerAssignmentFormSchema.safeParse({
      userId: "",
      reason: "ok",
      confirmed: false,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      "Choose the member to make an owner.",
      "Describe how you verified the request in at least 5 characters.",
      "Confirm that you verified the request outside HealthAlyst.",
    ]);
  });

  it("accepts a verified request", () => {
    expect(
      ownerAssignmentFormSchema.safeParse({
        userId: "0f6b8b9e-7c1d-4a1e-9a40-2a1f5c3d4e5f",
        reason: "Called the medical director on the registered number.",
        confirmed: true,
      }).success
    ).toBe(true);
  });
});
