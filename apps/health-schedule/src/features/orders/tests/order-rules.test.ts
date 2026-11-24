import { describe, expect, it } from "vitest";
import {
  orderFormSchema,
  cancelOrderFormSchema,
} from "~/features/orders/schemas/order-form-schemas";
import {
  orderSchema,
  resultsInboxSchema,
  type Order,
  type OrderableService,
} from "~/features/orders/schemas/order-response-schemas";
import {
  canCancelOrder,
  describeOrderProgress,
  describeOrderStatus,
  describeResultFlags,
  describeResultValue,
  describeTurnaround,
  filterCatalogue,
  findCommonServices,
  findOpenOrders,
  findRecentResults,
  readPatientsWithResults,
  searchCatalogue,
  toCreateOrdersRequest,
} from "~/features/orders/utilities/order-rules";
import { buildHealthScheduleNavigation } from "~/features/product-access/utilities/build-health-schedule-navigation";

const NOW = new Date("2026-11-24T10:00:00.000Z");

function service(overrides: Partial<OrderableService>): OrderableService {
  return {
    id: "service-fbc",
    code: "FBC",
    name: "Full blood count",
    kind: "LAB",
    departmentId: null,
    specimen: "BLOOD",
    fields: [],
    turnaroundHours: 4,
    isActive: true,
    version: 1,
    ...overrides,
  };
}

function order(overrides: Partial<Order>): Order {
  return {
    id: "order-1",
    groupId: "group-1",
    patientId: "patient-1",
    visitId: null,
    serviceId: "service-fbc",
    serviceCode: "FBC",
    serviceName: "Full blood count",
    kind: "LAB",
    departmentId: null,
    specimen: "BLOOD",
    priority: "ROUTINE",
    indication: null,
    status: "ORDERED",
    orderedById: "doctor-1",
    orderedAt: "2026-11-23T09:00:00.000Z",
    collectedAt: null,
    startedAt: null,
    rejectedReason: null,
    cancelReason: null,
    result: null,
    critical: false,
    payment: { status: "NO_CHARGE", patientKobo: 0, accountId: null },
    acknowledgedById: null,
    acknowledgedAt: null,
    version: 1,
    ...overrides,
  };
}

function released(releasedAt: string, overrides: Partial<Order> = {}): Order {
  return order({
    status: "RELEASED",
    result: {
      values: [
        {
          key: "hb",
          label: "Haemoglobin",
          value: "11.2",
          unit: "g/dL",
          flag: null,
          range: "12–16",
        },
      ],
      comment: null,
      enteredById: "scientist-1",
      enteredAt: releasedAt,
      releasedById: "scientist-2",
      releasedAt,
      amended: false,
    },
    ...overrides,
  });
}

const CATALOGUE = [
  service({}),
  service({
    id: "service-mrdt",
    code: "MRDT",
    name: "Malaria rapid diagnostic test",
  }),
  service({
    id: "service-cxr",
    code: "CXR",
    name: "Chest X-ray",
    kind: "IMAGING",
    specimen: null,
    turnaroundHours: 72,
  }),
  service({
    id: "service-pcv",
    code: "PCV",
    name: "Packed cell volume",
    isActive: false,
  }),
];

describe("choosing tests and scans", () => {
  it("finds tests by the start of the code or any part of the name", () => {
    expect(
      searchCatalogue(CATALOGUE, "fb", []).map((item) => item.code)
    ).toEqual(["FBC"]);
    expect(
      searchCatalogue(CATALOGUE, "x-ray", []).map((item) => item.code)
    ).toEqual(["CXR"]);
    expect(searchCatalogue(CATALOGUE, "  ", [])).toEqual([]);
  });

  it("leaves out tests already chosen and tests switched off", () => {
    expect(
      searchCatalogue(CATALOGUE, "c", ["service-cxr"]).map((item) => item.code)
    ).toEqual(["FBC", "MRDT"]);
    expect(searchCatalogue(CATALOGUE, "packed", [])).toEqual([]);
  });

  it("offers the common tests the catalogue has, in order", () => {
    expect(
      findCommonServices(CATALOGUE, ["CXR", "UA", "FBC", "PCV"]).map(
        (item) => item.code
      )
    ).toEqual(["CXR", "FBC"]);
  });

  it("filters the catalogue by words, kind and whether it can be ordered", () => {
    const codes = (filters: Parameters<typeof filterCatalogue>[1]) =>
      filterCatalogue(CATALOGUE, filters).map((item) => item.code);
    expect(
      codes({ searchText: "", kind: "IMAGING", availability: "" })
    ).toEqual(["CXR"]);
    expect(codes({ searchText: "", kind: "", availability: "off" })).toEqual([
      "PCV",
    ]);
    expect(
      codes({ searchText: "malaria", kind: "LAB", availability: "on" })
    ).toEqual(["MRDT"]);
    expect(codes({ searchText: "", kind: "", availability: "" })).toHaveLength(
      4
    );
  });

  it("says how long results take", () => {
    expect(describeTurnaround(1)).toBe("Results in about 1 hour");
    expect(describeTurnaround(24)).toBe("Results in about 24 hours");
    expect(describeTurnaround(72)).toBe("Results in about 3 days");
    expect(describeTurnaround(null)).toBeNull();
  });
});

describe("avoiding repeats", () => {
  it("finds the newest released result of each test from the last 7 days", () => {
    const recent = findRecentResults(
      [
        released("2026-11-20T09:00:00.000Z", { id: "older" }),
        released("2026-11-22T09:00:00.000Z", { id: "newer" }),
        released("2026-11-10T09:00:00.000Z", {
          id: "too-old",
          serviceId: "service-mrdt",
        }),
        order({ id: "not-released", serviceId: "service-cxr" }),
      ],
      NOW
    );
    expect(recent.get("service-fbc")?.id).toBe("newer");
    expect(recent.has("service-mrdt")).toBe(false);
    expect(recent.has("service-cxr")).toBe(false);
  });

  it("finds tests already ordered and not finished", () => {
    const openOrders = findOpenOrders([
      order({ id: "waiting", status: "COLLECTED" }),
      order({
        id: "cancelled",
        serviceId: "service-mrdt",
        status: "CANCELLED",
      }),
      released("2026-11-22T09:00:00.000Z", { serviceId: "service-cxr" }),
    ]);
    expect(openOrders.get("service-fbc")?.id).toBe("waiting");
    expect(openOrders.size).toBe(1);
  });
});

describe("orders and results", () => {
  it("describes where an order is in words that fit tests and scans", () => {
    expect(describeOrderStatus(order({ status: "COLLECTED" })).label).toBe(
      "Sample taken"
    );
    expect(
      describeOrderStatus(order({ status: "COLLECTED", kind: "IMAGING" })).label
    ).toBe("Patient arrived");
    expect(
      describeOrderStatus(
        order({ status: "ORDERED", rejectedReason: "Haemolysed" })
      ).label
    ).toBe("Sample to take again");
    expect(describeOrderStatus(order({ status: "RELEASED" })).tone).toBe(
      "positive"
    );
  });

  it("gives one status per order for lists", () => {
    expect(describeOrderProgress(order({ status: "CANCELLED" })).label).toBe(
      "Cancelled"
    );
    expect(
      describeOrderProgress(released("2026-11-22T09:00:00.000Z")).label
    ).toBe("Result ready");
    expect(
      describeOrderProgress({
        ...released("2026-11-22T09:00:00.000Z"),
        critical: true,
      }).label
    ).toBe("Critical result");
  });

  it("cancels only before work has started", () => {
    expect(canCancelOrder(order({ status: "ORDERED" }))).toBe(true);
    expect(canCancelOrder(order({ status: "COLLECTED" }))).toBe(true);
    expect(canCancelOrder(order({ status: "IN_PROGRESS" }))).toBe(false);
    expect(canCancelOrder(order({ status: "RELEASED" }))).toBe(false);
  });

  it("never calls an unflagged result normal", () => {
    const result = released("2026-11-22T09:00:00.000Z");
    expect(describeResultFlags(result).label).toBe("Nothing flagged");
    expect(describeResultFlags({ ...result, critical: true }).label).toBe(
      "Critical"
    );
    const flagged = released("2026-11-22T09:00:00.000Z");
    const firstValue = flagged.result?.values[0];
    if (firstValue) firstValue.flag = "LOW";
    expect(describeResultFlags(flagged).label).toBe("Outside range");
  });

  it("shows a value with its unit", () => {
    const value = {
      key: "hb",
      label: "Haemoglobin",
      value: "11.2",
      unit: "g/dL",
      flag: null,
      range: null,
    };
    expect(describeResultValue(value)).toBe("11.2 g/dL");
    expect(describeResultValue({ ...value, unit: null })).toBe("11.2");
    expect(describeResultValue({ ...value, value: null })).toBe("No value");
  });

  it("marks patients with results waiting", () => {
    expect([
      ...readPatientsWithResults([
        { patientId: "a" },
        { patientId: "b" },
        { patientId: "a" },
      ]),
    ]).toEqual(["a", "b"]);
  });

  it("reads orders and inbox rows as the API sends them", () => {
    expect(orderSchema.parse(released("2026-11-22T09:00:00.000Z")).status).toBe(
      "RELEASED"
    );
    const inbox = resultsInboxSchema.parse({
      data: [
        {
          ...released("2026-11-22T09:00:00.000Z"),
          patient: {
            id: "patient-1",
            patientNumber: "P000039",
            firstName: "Daniel",
            lastName: "Adeyemi",
            sex: "male",
            dateOfBirth: "1988-03-19",
          },
        },
      ],
    });
    expect(inbox.data[0]?.patient.patientNumber).toBe("P000039");
  });
});

describe("sending orders", () => {
  it("needs at least one test", () => {
    expect(
      orderFormSchema.safeParse({
        serviceIds: [],
        priority: "ROUTINE",
        indication: "",
      }).success
    ).toBe(false);
  });

  it("asks why an order is cancelled", () => {
    expect(cancelOrderFormSchema.safeParse({ reason: "no" }).success).toBe(
      false
    );
    expect(
      cancelOrderFormSchema.safeParse({ reason: "No longer needed" }).success
    ).toBe(true);
  });

  it("sends one item per test with the group identifier and visit", () => {
    expect(
      toCreateOrdersRequest({
        values: {
          serviceIds: ["service-fbc", "service-cxr"],
          priority: "URGENT",
          indication: " fever 3 days ",
        },
        groupId: "group-1",
        visitId: "visit-1",
      })
    ).toEqual({
      id: "group-1",
      visitId: "visit-1",
      priority: "URGENT",
      indication: "fever 3 days",
      items: [{ serviceId: "service-fbc" }, { serviceId: "service-cxr" }],
    });
  });

  it("leaves out an empty clinical question and a missing visit", () => {
    expect(
      toCreateOrdersRequest({
        values: {
          serviceIds: ["service-fbc"],
          priority: "ROUTINE",
          indication: "  ",
        },
        groupId: "group-2",
      })
    ).toEqual({
      id: "group-2",
      priority: "ROUTINE",
      items: [{ serviceId: "service-fbc" }],
    });
  });
});

describe("navigation", () => {
  function labels(permissions: string[]) {
    return buildHealthScheduleNavigation({
      permissions,
      organizationAppLinks: null,
    }).sidebar.flatMap((section) => section.items.map((item) => item.label));
  }

  it("shows results to doctors who order tests", () => {
    expect(labels(["order:create"])).toContain("Results to review");
    expect(labels(["queue:read"])).not.toContain("Results to review");
  });

  it("lists the tests and scans under setup", () => {
    expect(labels(["schedule:read", "patient:read"])).toContain(
      "Tests and scans"
    );
    expect(labels(["schedule:read"])).not.toContain("Tests and scans");
  });
});
