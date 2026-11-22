import { describe, expect, it } from "vitest";
import { createTriageFormSchema } from "~/features/patient-flow/schemas/triage-form-schema";
import {
  assessDangerSigns,
  describeOrdinal,
  isAssessedAsAdult,
  needsOverride,
  predictQueuePosition,
  readVitals,
  suggestBand,
  toTriageRequest,
  type TriageFormValues,
} from "~/features/patient-flow/utilities/triage-assessment";

const EMPTY: TriageFormValues = {
  complaint: "",
  temperatureC: "",
  heartRate: "",
  respiratoryRate: "",
  systolicBp: "",
  diastolicBp: "",
  spo2: "",
  consciousness: "",
  painScore: "",
  glucoseMmolL: "",
  weightKg: "",
  heightCm: "",
  band: "",
  overrideReason: "",
  notes: "",
};

describe("danger signs", () => {
  it("matches the API at the edges of each range", () => {
    const codesFor = (values: Partial<TriageFormValues>) =>
      assessDangerSigns(readVitals({ ...EMPTY, ...values })).dangerSigns.map(
        (sign) => sign.code
      );
    expect(codesFor({ spo2: "89" })).toEqual(["SPO2_BELOW_90"]);
    expect(codesFor({ spo2: "93" })).toEqual(["SPO2_90_TO_93"]);
    expect(codesFor({ spo2: "94" })).toEqual([]);
    expect(codesFor({ heartRate: "110" })).toEqual([]);
    expect(codesFor({ heartRate: "111" })).toEqual(["HEART_RATE_111_TO_130"]);
    expect(codesFor({ heartRate: "131" })).toEqual(["HEART_RATE_ABOVE_130"]);
    expect(codesFor({ respiratoryRate: "20" })).toEqual([]);
    expect(codesFor({ respiratoryRate: "22" })).toEqual([
      "RESPIRATORY_RATE_21_TO_29",
    ]);
    expect(codesFor({ temperatureC: "38.4" })).toEqual([]);
    expect(codesFor({ temperatureC: "38.5" })).toEqual([
      "TEMPERATURE_38_5_TO_40",
    ]);
    expect(codesFor({ temperatureC: "40" })).toEqual([
      "TEMPERATURE_40_OR_ABOVE",
    ]);
    expect(codesFor({ consciousness: "VOICE" })).toEqual(["NOT_ALERT"]);
    expect(codesFor({ painScore: "8" })).toEqual(["SEVERE_PAIN"]);
  });

  it("suggests red over yellow, routine with no signs, and nothing for children", () => {
    const vitals = readVitals({ ...EMPTY, spo2: "92", systolicBp: "85" });
    expect(assessDangerSigns(vitals).suggestedBand).toBe("RED");
    expect(
      suggestBand({
        vitals: readVitals({ ...EMPTY, temperatureC: "37" }),
        isAdult: true,
      })
    ).toBe("GREEN");
    expect(suggestBand({ vitals: {}, isAdult: true })).toBeNull();
    expect(suggestBand({ vitals, isAdult: false })).toBeNull();
  });

  it("treats patients from 16, and those of unknown age, as adults", () => {
    const now = new Date("2026-11-16T09:00:00+01:00");
    expect(isAssessedAsAdult(null, now)).toBe(true);
    expect(isAssessedAsAdult("2010-11-16", now)).toBe(true);
    expect(isAssessedAsAdult("2010-11-17", now)).toBe(false);
  });
});

describe("overriding red", () => {
  it("needs a reason to go below a red suggestion or lower a red patient", () => {
    expect(
      needsOverride({ band: "YELLOW", suggestedBand: "RED", currentBand: null })
    ).toBe(true);
    expect(
      needsOverride({ band: "GREEN", suggestedBand: null, currentBand: "RED" })
    ).toBe(true);
    expect(
      needsOverride({ band: "RED", suggestedBand: "RED", currentBand: null })
    ).toBe(false);
    expect(
      needsOverride({
        band: "GREEN",
        suggestedBand: "YELLOW",
        currentBand: null,
      })
    ).toBe(false);
  });

  it("asks for the reason in the form", () => {
    const schema = createTriageFormSchema({ isAdult: true, currentBand: null });
    const withoutReason = schema.safeParse({
      ...EMPTY,
      spo2: "85",
      band: "YELLOW",
    });
    expect(withoutReason.error?.issues[0]?.path).toEqual(["overrideReason"]);
    expect(
      schema.safeParse({
        ...EMPTY,
        spo2: "85",
        band: "YELLOW",
        overrideReason: "Known COPD, saturation usual for her",
      }).success
    ).toBe(true);
  });
});

describe("vitals form", () => {
  const schema = createTriageFormSchema({ isAdult: true, currentBand: null });
  const pathsFor = (values: Partial<TriageFormValues>) =>
    schema
      .safeParse({ ...EMPTY, band: "GREEN", ...values })
      .error?.issues.map((issue) => issue.path[0]) ?? [];

  it("checks ranges, whole numbers and blood pressure order", () => {
    expect(pathsFor({ spo2: "101" })).toEqual(["spo2"]);
    expect(pathsFor({ heartRate: "72.5" })).toEqual(["heartRate"]);
    expect(pathsFor({ temperatureC: "37.25" })).toEqual(["temperatureC"]);
    expect(pathsFor({ temperatureC: "abc" })).toEqual(["temperatureC"]);
    expect(pathsFor({ systolicBp: "120", diastolicBp: "120" })).toEqual([
      "diastolicBp",
    ]);
    expect(pathsFor({ temperatureC: "37.4", systolicBp: "120" })).toEqual([]);
  });

  it("needs a band", () => {
    expect(
      schema.safeParse(EMPTY).error?.issues.map((issue) => issue.path[0])
    ).toEqual(["band"]);
  });

  it("sends only what was recorded", () => {
    expect(
      toTriageRequest(
        {
          ...EMPTY,
          complaint: " Fever and cough ",
          temperatureC: "38.6",
          heartRate: "96",
          consciousness: "ALERT",
          painScore: "3",
          band: "YELLOW",
          overrideReason: "Not needed",
        },
        false
      )
    ).toEqual({
      temperatureC: 38.6,
      heartRate: 96,
      consciousness: "ALERT",
      painScore: 3,
      band: "YELLOW",
      complaint: "Fever and cough",
    });
  });
});

describe("place in the doctor's queue", () => {
  it("goes after everyone at the same or a higher priority", () => {
    expect(predictQueuePosition(["GREEN", null, "YELLOW"], "YELLOW")).toBe(2);
    expect(predictQueuePosition(["GREEN", null, "YELLOW"], "RED")).toBe(1);
    expect(predictQueuePosition(["GREEN", null, "YELLOW"], "GREEN")).toBe(4);
  });

  it.each([
    [1, "1st"],
    [2, "2nd"],
    [3, "3rd"],
    [4, "4th"],
    [11, "11th"],
    [12, "12th"],
    [21, "21st"],
  ])("writes %i as %s", (position, expected) => {
    expect(describeOrdinal(position)).toBe(expected);
  });
});
