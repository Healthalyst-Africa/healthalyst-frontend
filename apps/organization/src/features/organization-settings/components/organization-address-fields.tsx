"use client";

import { useState } from "react";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { LocalGovernmentAreaLoadNotice } from "~/shared/organization/components/local-government-area-load-notice";
import { LOCAL_GOVERNMENT_AREA_FIELD_TEXT } from "~/shared/organization/config/local-government-areas";
import { nigerianStateOptions } from "~/shared/organization/config/organization-reference";
import { useLocalGovernmentAreaChoice } from "~/shared/organization/hooks/use-local-government-area-choice";

/**
 * The state and local government area (LGA) of the profile form. The area
 * list follows the state, and choosing another state clears the area, as the
 * API only accepts one of the state's own areas. An area saved before the
 * official list existed stays selectable until someone changes it.
 *
 * Both values are also kept in hidden inputs, so the form always submits them,
 * even while the area dropdown waits for its list.
 */
export function OrganizationAddressFields({
  savedStateCode,
  savedLocalGovernmentArea,
  errors,
}: {
  savedStateCode: string;
  savedLocalGovernmentArea: string;
  errors: Readonly<Record<string, string | undefined>>;
}) {
  const [stateCode, setStateCode] = useState(savedStateCode);
  const [localGovernmentArea, setLocalGovernmentArea] = useState(
    savedLocalGovernmentArea
  );
  const choice = useLocalGovernmentAreaChoice({
    stateCode,
    savedArea: {
      stateCode: savedStateCode,
      localGovernmentArea: savedLocalGovernmentArea,
    },
  });

  return (
    <>
      <SelectField
        id="profile-state"
        label="State"
        name="stateCode"
        placeholder="Choose a state"
        options={nigerianStateOptions}
        value={stateCode}
        required
        error={errors.stateCode}
        onValueChange={(nextStateCode) => {
          if (nextStateCode === stateCode) return;
          setStateCode(nextStateCode);
          setLocalGovernmentArea("");
        }}
      />
      <SelectField
        id="profile-local-government-area"
        label={LOCAL_GOVERNMENT_AREA_FIELD_TEXT.label}
        placeholder={choice.placeholder}
        options={choice.options}
        value={localGovernmentArea}
        disabled={choice.unavailable}
        error={errors.lga}
        onValueChange={setLocalGovernmentArea}
      />
      <input type="hidden" name="lga" value={localGovernmentArea} />
      {choice.loadError && (
        <div className="sm:col-span-2">
          <LocalGovernmentAreaLoadNotice choice={choice} />
        </div>
      )}
    </>
  );
}
