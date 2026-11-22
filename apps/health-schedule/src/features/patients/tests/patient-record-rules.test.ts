import { describe, expect, it } from "vitest";
import { readPatientStatuses } from "~/features/patients/components/patient-banner";
import {
  coverageFormSchema,
  createPatientDetailsFormSchema,
  registrationFormSchema,
  type PatientFormValues,
} from "~/features/patients/schemas/patient-form-schemas";
import type {
  PatientCoverage,
  PatientDetail,
} from "~/features/patients/schemas/patient-response-schemas";
import {
  describeAge,
  describeCoverage,
  describeMissingFields,
  describePatientFacts,
  describePatientFullName,
  toEntityTag,
} from "~/features/patients/utilities/patient-presentation";
import {
  toCoverageChanges,
  toCoverageFormValues,
  toCoverageRequest,
  toDuplicateCheckRequest,
  toPatientChanges,
  toPatientFormValues,
  toRegistrationRequest,
} from "~/features/patients/utilities/patient-requests";

const NOW = new Date("2026-11-19T09:00:00+01:00");

const EMPTY_FORM: PatientFormValues = {
  firstName: "",
  middleName: "",
  lastName: "",
  sex: "",
  birthKnown: "date",
  dateOfBirth: "",
  ageYears: "",
  phone: "",
  email: "",
  addressLine: "",
  city: "",
  stateCode: "",
  folderNumber: "",
  nin: "",
  preferredLanguage: "",
  contactChannel: "",
  detailsLater: false,
  remindersConsent: false,
};

const FILLED_FORM: PatientFormValues = {
  ...EMPTY_FORM,
  firstName: " Ngozi ",
  lastName: "Okafor",
  sex: "female",
  dateOfBirth: "1988-04-12",
  phone: "0803 123 4567",
};

const COVERAGE: PatientCoverage = {
  id: "coverage-1",
  payerType: "HMO",
  payerName: "Reliance HMO",
  planName: "Gold",
  memberNumber: "RH-1234",
  relationship: "SELF",
  principalName: null,
  employerName: null,
  validFrom: null,
  validUntil: "2027-01-31",
  isExpired: false,
  isPrimary: true,
  status: "ACTIVE",
  eligibility: "VERIFIED",
  eligibilityCheckedAt: "2026-11-19T08:30:00.000Z",
  eligibilityReference: "AUTH-9",
  eligibilityNote: null,
  version: 3,
};

const PATIENT: PatientDetail = {
  id: "patient-1",
  patientNumber: "P000123",
  folderNumber: "OPD/2019/0412",
  firstName: "Ngozi",
  lastName: "Okafor",
  middleName: "Ada",
  sex: "female",
  dateOfBirth: "1988-04-12",
  dateOfBirthEstimated: false,
  phone: "+2348031234567",
  email: null,
  addressLine: "12 Admiralty Way",
  city: "Lekki",
  stateCode: "LA",
  preferredLanguage: null,
  contactChannel: null,
  missingFields: [],
  nin: null,
  hasNin: false,
  isTemporary: false,
  temporaryLabel: null,
  status: "ACTIVE",
  mergedIntoId: null,
  version: 4,
  createdAt: "2026-11-01T10:00:00.000Z",
  allergyStatus: "RECORDED",
  allergies: [
    {
      id: "allergy-1",
      substance: "Penicillin",
      category: "DRUG",
      severity: "SEVERE",
    },
  ],
  primaryCoverage: COVERAGE,
  photoDocumentId: null,
  restricted: false,
  messaging: {
    remindersConsent: true,
    channel: "SMS",
    language: "en",
    canMessage: true,
  },
};

describe("registering", () => {
  const issuePaths = (values: PatientFormValues) =>
    registrationFormSchema
      .safeParse(values)
      .error?.issues.map((issue) => issue.path[0]) ?? [];

  it("needs a date of birth or age, unless it is added later", () => {
    expect(issuePaths({ ...FILLED_FORM, dateOfBirth: "" })).toEqual([
      "dateOfBirth",
    ]);
    expect(
      issuePaths({ ...FILLED_FORM, dateOfBirth: "", detailsLater: true })
    ).toEqual([]);
    expect(
      issuePaths({ ...FILLED_FORM, birthKnown: "age", ageYears: "41" })
    ).toEqual([]);
    expect(
      issuePaths({ ...FILLED_FORM, birthKnown: "age", ageYears: "four" })
    ).toEqual(["ageYears"]);
  });

  it("refuses a future birth date, a bad phone, NIN or email", () => {
    expect(issuePaths({ ...FILLED_FORM, dateOfBirth: "2999-01-01" })).toEqual([
      "dateOfBirth",
    ]);
    expect(issuePaths({ ...FILLED_FORM, phone: "12345" })).toEqual(["phone"]);
    expect(issuePaths({ ...FILLED_FORM, nin: "1234" })).toEqual(["nin"]);
    expect(issuePaths({ ...FILLED_FORM, email: "not an email" })).toEqual([
      "email",
    ]);
  });

  it("sends a full registration, or a quick one when details come later", () => {
    const full = toRegistrationRequest(
      { ...FILLED_FORM, remindersConsent: true, nin: "12345678901" },
      {
        registrationIdentifier: "registration-1",
        canRecordNin: false,
        canRecordConsent: true,
      }
    );
    expect(full).toEqual({
      kind: "full",
      request: {
        id: "registration-1",
        firstName: "Ngozi",
        lastName: "Okafor",
        sex: "female",
        phone: "+2348031234567",
        dateOfBirth: "1988-04-12",
        remindersConsent: { method: "VERBAL" },
      },
    });
    const quick = toRegistrationRequest(
      { ...FILLED_FORM, detailsLater: true, remindersConsent: true },
      {
        registrationIdentifier: "registration-2",
        canRecordNin: true,
        canRecordConsent: false,
      }
    );
    expect(quick.kind).toBe("quick");
    expect(quick.request).not.toHaveProperty("dateOfBirth");
    expect(quick.request).not.toHaveProperty("remindersConsent");
  });

  it("checks for duplicates once both names are typed", () => {
    expect(toDuplicateCheckRequest({ ...EMPTY_FORM, firstName: "Ngozi" })).toBe(
      null
    );
    expect(
      toDuplicateCheckRequest({
        ...FILLED_FORM,
        birthKnown: "age",
        ageYears: "4x",
      })
    ).toEqual({
      firstName: "Ngozi",
      lastName: "Okafor",
      sex: "female",
      phone: "+2348031234567",
    });
  });
});

describe("editing details", () => {
  it("sends only what changed, clearing emptied fields", () => {
    const values = {
      ...toPatientFormValues(PATIENT),
      city: "",
      email: "ngozi@example.com",
      phone: "0803 123 4567",
    };
    expect(toPatientChanges(PATIENT, values, { canRecordNin: false })).toEqual({
      city: null,
      email: "ngozi@example.com",
    });
  });

  it("replaces an estimated birth date with a typed age or exact date", () => {
    const estimated = {
      ...PATIENT,
      dateOfBirth: "1985-01-01",
      dateOfBirthEstimated: true,
    };
    const asForm = toPatientFormValues(estimated);
    expect(asForm.birthKnown).toBe("age");
    expect(
      toPatientChanges(
        estimated,
        { ...asForm, ageYears: "42" },
        { canRecordNin: false }
      )
    ).toEqual({ ageYears: 42 });
    expect(
      toPatientChanges(
        estimated,
        { ...asForm, birthKnown: "date", dateOfBirth: "1985-01-01" },
        { canRecordNin: false }
      )
    ).toEqual({ dateOfBirth: "1985-01-01" });
  });

  it("keeps the date of birth and phone required once recorded", () => {
    const schema = createPatientDetailsFormSchema({
      birthRequired: true,
      phoneRequired: false,
    });
    expect(
      schema
        .safeParse({
          ...toPatientFormValues(PATIENT),
          dateOfBirth: "",
          phone: "",
        })
        .error?.issues.map((issue) => issue.path[0])
    ).toEqual(["dateOfBirth"]);
  });

  it("sends the record's version as If-Match", () => {
    expect(toEntityTag(4)).toBe('"4"');
  });
});

describe("insurance cover", () => {
  it("needs the member's name for a dependant, and dates in order", () => {
    const values = {
      ...toCoverageFormValues(null),
      payerType: "HMO",
      payerName: "Reliance HMO",
      memberNumber: "RH-1234",
      relationship: "CHILD",
      validFrom: "2027-01-01",
      validUntil: "2026-01-01",
    };
    expect(
      coverageFormSchema
        .safeParse(values)
        .error?.issues.map((issue) => issue.path[0])
    ).toEqual(["principalName", "validUntil"]);
  });

  it("sends a new cover without empty fields", () => {
    expect(
      toCoverageRequest({
        ...toCoverageFormValues(null),
        payerType: "NHIA",
        payerName: " NHIA ",
        memberNumber: "N-55",
      })
    ).toEqual({
      payerType: "NHIA",
      payerName: "NHIA",
      memberNumber: "N-55",
      relationship: "SELF",
    });
  });

  it("sends only changed cover fields", () => {
    expect(
      toCoverageChanges(COVERAGE, {
        ...toCoverageFormValues(COVERAGE),
        planName: "",
        memberNumber: "RH-9999",
      })
    ).toEqual({ planName: null, memberNumber: "RH-9999" });
  });
});

describe("presenting a patient", () => {
  it.each([
    ["2026-05-19", false, "6 months"],
    ["2025-10-19", false, "13 months"],
    ["1988-04-12", false, "38 years"],
    ["1985-01-01", true, "about 41 years"],
  ] as const)(
    "describes a birth on %s (estimated %s) as %s",
    (birth, estimated, expected) => {
      expect(describeAge(birth, estimated, NOW)).toBe(expected);
    }
  );

  it("names unidentified patients by their description", () => {
    expect(describePatientFullName(PATIENT)).toBe("Ngozi Ada Okafor");
    expect(
      describePatientFullName({
        ...PATIENT,
        isTemporary: true,
        temporaryLabel: "Unknown man, brought by ambulance",
      })
    ).toBe("Unknown man, brought by ambulance");
  });

  it("lists sex, age and numbers", () => {
    expect(describePatientFacts(PATIENT, NOW)).toEqual([
      "Female",
      "38 years",
      "P000123",
      "Folder OPD/2019/0412",
    ]);
    expect(describeMissingFields(["dateOfBirth", "phone"])).toBe(
      "date of birth or age and phone number"
    );
    expect(describeCoverage(COVERAGE)).toBe("Reliance HMO, Gold");
  });

  it("shows cover, restrictions and unfinished registration on the banner", () => {
    expect(readPatientStatuses(PATIENT).map((status) => status.label)).toEqual([
      "Reliance HMO, Gold: Cover confirmed",
    ]);
    expect(
      readPatientStatuses({
        ...PATIENT,
        primaryCoverage: { ...COVERAGE, isExpired: true },
        restricted: true,
        missingFields: ["dateOfBirth"],
        messaging: { ...PATIENT.messaging, canMessage: false },
      }).map((status) => status.label)
    ).toEqual([
      "Reliance HMO, Gold: Cover expired",
      "Restricted record",
      "Add date of birth or age",
      "No text reminders",
    ]);
    expect(
      readPatientStatuses({ ...PATIENT, primaryCoverage: null })[0]?.label
    ).toBe("Self-pay");
  });
});
