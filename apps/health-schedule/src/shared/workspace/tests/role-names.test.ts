import { describe, expect, it } from "vitest";
import { describeRoles } from "~/shared/workspace/role-names";

describe("role names", () => {
  it("names preset roles the way staff say them", () => {
    expect(describeRoles(["owner"])).toBe("Owner");
    expect(describeRoles(["lab"])).toBe("Laboratory scientist");
  });

  it("turns a custom role's code into words", () => {
    expect(describeRoles(["ward_clerk"])).toBe("Ward clerk");
  });

  it("joins several roles and has nothing to say without one", () => {
    expect(describeRoles(["doctor", "manager", "cashier"])).toBe(
      "Doctor, Manager and Cashier"
    );
    expect(describeRoles([])).toBeNull();
  });
});
