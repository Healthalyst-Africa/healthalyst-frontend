import { describe, expect, it } from "vitest";
import { replaceFormField } from "@healthalyst/ui/forms/form-definition";
import { contactFormDefinition } from "~/features/organization-registration/config/organization-registration-form-definition";
import { registrationSchema } from "~/features/organization-registration/schemas/organization-registration-schema";
import { LOCAL_GOVERNMENT_AREA_CONFIGURATION } from "~/shared/organization/config/local-government-areas";
import { localGovernmentAreasResponseSchema } from "~/shared/organization/schemas/local-government-areas-schema";
import { createLocalGovernmentAreaField } from "~/shared/organization/utilities/local-government-area-field";

describe("local government areas", () => {
  it("asks the API for one state's areas", () => {
    expect(LOCAL_GOVERNMENT_AREA_CONFIGURATION.endpoint("LA")).toBe(
      "/v1/reference/states/LA/lgas"
    );
  });

  it("reads the API's list of a state's areas", () => {
    expect(
      localGovernmentAreasResponseSchema.parse({
        state: { code: "LA", name: "Lagos" },
        data: ["Agege", "Ikeja"],
      }).data
    ).toEqual(["Agege", "Ikeja"]);
  });

  it("puts the state's areas into the registration form's dropdown", () => {
    const definition = replaceFormField(
      contactFormDefinition,
      "localGovernmentArea",
      createLocalGovernmentAreaField({
        name: "localGovernmentArea",
        choice: {
          options: [{ value: "Ikeja", label: "Ikeja" }],
          placeholder: "Select the local government area",
          unavailable: false,
          loadError: undefined,
          isRetrying: false,
          retry: () => undefined,
        },
      })
    );
    const field = definition.sections
      .flatMap((section) => section.fields)
      .find((candidate) => candidate.name === "localGovernmentArea");
    expect(field).toMatchObject({
      kind: "select",
      disabled: false,
      options: [{ value: "Ikeja", label: "Ikeja" }],
    });
  });

  it("accepts a registration whose area dropdown was never turned on", () => {
    // A disabled dropdown submits nothing, so the field is absent.
    const result = registrationSchema.safeParse({ stateCode: "LA" });
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some(
        (issue) => issue.path[0] === "localGovernmentArea"
      )
    ).toBe(false);
  });
});
