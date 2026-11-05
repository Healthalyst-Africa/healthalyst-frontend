"use client";

import { useState, type FormEvent } from "react";
import { EditIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { BrandLoader } from "@healthalyst/ui/components/brand-loader";
import { CheckboxField } from "@healthalyst/ui/components/checkbox-field";
import { FormMessage } from "@healthalyst/ui/components/form-message";
import { HintText } from "@healthalyst/ui/components/hint-text";
import {
  NoticeBanner,
  StateNotice,
} from "@healthalyst/ui/components/notice-banner";
import { SummaryDetailList } from "@healthalyst/ui/components/review-summary";
import { SectionHeading } from "@healthalyst/ui/components/section-heading";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { TextField } from "@healthalyst/ui/components/text-field";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { BRAND_MARK_SOURCE } from "~/config/brand";
import {
  usePlatformOrganizationQuery,
  usePlatformOrganizationUpdateMutation,
} from "~/features/organization-management/hooks/use-platform-organization";
import { organizationProfileFormSchema } from "~/features/organization-settings/schemas/organization-settings-schemas";
import {
  isStaleVersionError,
  readProfileChanges,
} from "~/features/organization-settings/utilities/organization-settings-changes";
import {
  nigerianStateOptions,
  organizationTypeOptions,
} from "~/shared/organization/config/organization-reference";
import { ORGANIZATION_FIELD_LIMITS } from "~/shared/organization/config/organization-validation";
import {
  focusFirstInvalidField,
  parseFormData,
} from "~/shared/forms/form-validation";

function findOptionLabel(
  options: readonly { value: string; label: string }[],
  value: string | null
): string | null {
  return options.find((option) => option.value === value)?.label ?? value;
}

/** The organisation's profile, read-only until someone with permission edits it. */
export function OrganizationProfileSection({
  organizationId,
  userId,
  canEdit,
}: {
  organizationId: string;
  userId: string;
  canEdit: boolean;
}) {
  const profileQuery = usePlatformOrganizationQuery({ organizationId, userId });
  const updateMutation = usePlatformOrganizationUpdateMutation({
    organizationId,
    userId,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [savedMessage, setSavedMessage] = useState<{
    tone: "success" | "status";
    text: string;
  } | null>(null);
  const profile = profileQuery.data;

  const serverFieldErrors =
    updateMutation.error instanceof PlatformApiError
      ? updateMutation.error.fieldErrors
      : {};
  const visibleFieldErrors = { ...serverFieldErrors, ...fieldErrors };
  const hasStaleVersion = isStaleVersionError(updateMutation.error);
  const generalError =
    updateMutation.error &&
    !hasStaleVersion &&
    Object.keys(serverFieldErrors).length === 0
      ? updateMutation.error.message
      : "";

  function startEditing() {
    updateMutation.reset();
    setFieldErrors({});
    setSavedMessage(null);
    setIsEditing(true);
  }

  function stopEditing() {
    updateMutation.reset();
    setFieldErrors({});
    setIsEditing(false);
  }

  function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!profile) return;
    const formElement = formEvent.currentTarget;
    const validationResult = parseFormData(
      organizationProfileFormSchema,
      new FormData(formElement)
    );
    if (!validationResult.success) {
      setFieldErrors(validationResult.errors);
      focusFirstInvalidField(formElement, validationResult.errors);
      return;
    }
    setFieldErrors({});
    const changes = readProfileChanges(profile, validationResult.data);
    if (Object.keys(changes).length === 0) {
      setSavedMessage({
        tone: "status",
        text: "Nothing had changed, so there was nothing to save.",
      });
      setIsEditing(false);
      return;
    }
    updateMutation.mutate(
      { entityTag: profile.entityTag, changes },
      {
        onSuccess: () => {
          setSavedMessage({
            tone: "success",
            text: "Your organisation details have been saved.",
          });
          setIsEditing(false);
        },
        onError: (error) => {
          if (error instanceof PlatformApiError) {
            focusFirstInvalidField(formElement, error.fieldErrors);
          }
        },
      }
    );
  }

  function reloadProfile() {
    updateMutation.reset();
    void profileQuery.refetch();
  }

  return (
    <section aria-labelledby="profile-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeading
          headingIdentifier="profile-heading"
          heading="Organisation details"
          description="How your organisation appears to patients and partners on HealthAlyst."
        />
        {canEdit && profile && !isEditing && (
          <ActionButton
            type="button"
            variant="outline"
            leadingIcon={<EditIcon className="size-4" />}
            onClick={startEditing}
          >
            Edit details
          </ActionButton>
        )}
      </div>
      {profileQuery.isPending ? (
        <BrandLoader
          markSource={BRAND_MARK_SOURCE}
          label="Loading your organisation details"
          presentation="inline"
        />
      ) : profileQuery.isError ? (
        <StateNotice
          tone="error"
          title="We could not load your organisation details"
          action={
            <ActionButton
              type="button"
              variant="outline"
              onClick={() => void profileQuery.refetch()}
            >
              Try again
            </ActionButton>
          }
        >
          {profileQuery.error.message}
        </StateNotice>
      ) : profile && isEditing ? (
        <form
          key={profile.entityTag}
          className="flex flex-col gap-5"
          onSubmit={handleSubmit}
          noValidate
        >
          {hasStaleVersion && (
            <NoticeBanner
              tone="warning"
              title="Someone else changed these details"
              action={
                <ActionButton
                  type="button"
                  variant="outline"
                  isLoading={profileQuery.isFetching}
                  loadingText="Reloading"
                  onClick={reloadProfile}
                >
                  Reload details
                </ActionButton>
              }
            >
              Reload to see their changes, then make yours again.
            </NoticeBanner>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              id="profile-trading-name"
              label="Trading name"
              name="tradingName"
              defaultValue={profile.tradingName}
              maxLength={ORGANIZATION_FIELD_LIMITS.name}
              required
              error={visibleFieldErrors.tradingName}
            />
            <TextField
              id="profile-email"
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={profile.email ?? ""}
              maxLength={ORGANIZATION_FIELD_LIMITS.emailAddress}
              required
              error={visibleFieldErrors.email}
            />
            <TextField
              id="profile-phone"
              label="Phone number"
              name="phone"
              type="tel"
              autoComplete="tel"
              defaultValue={profile.phone ?? ""}
              required
              error={visibleFieldErrors.phone}
            />
            <TextField
              id="profile-address"
              label="Street address"
              name="addressLine"
              autoComplete="street-address"
              defaultValue={profile.addressLine ?? ""}
              maxLength={ORGANIZATION_FIELD_LIMITS.addressLine}
              required
              error={visibleFieldErrors.addressLine}
            />
            <TextField
              id="profile-city"
              label="Town or city"
              name="city"
              defaultValue={profile.city ?? ""}
              maxLength={ORGANIZATION_FIELD_LIMITS.city}
              required
              error={visibleFieldErrors.city}
            />
            <SelectField
              id="profile-state"
              label="State"
              name="stateCode"
              placeholder="Choose a state"
              options={nigerianStateOptions}
              defaultValue={profile.stateCode ?? ""}
              required
              error={visibleFieldErrors.stateCode}
            />
            <TextField
              id="profile-local-government-area"
              label="Local government area"
              name="lga"
              defaultValue={profile.lga ?? ""}
              maxLength={ORGANIZATION_FIELD_LIMITS.localGovernmentArea}
              error={visibleFieldErrors.lga}
            />
          </div>
          <CheckboxField
            id="profile-directory-listed"
            name="directoryListed"
            label="List this organisation in the HealthAlyst directory"
            description="Other organisations can find you to send referrals."
            defaultChecked={profile.directoryListed}
          />
          {generalError && (
            <FormMessage tone="error">{generalError}</FormMessage>
          )}
          <div className="flex flex-wrap gap-3">
            <ActionButton
              type="submit"
              isLoading={updateMutation.isPending}
              loadingText="Saving details"
              disabled={hasStaleVersion}
            >
              Save details
            </ActionButton>
            <ActionButton
              type="button"
              variant="outline"
              disabled={updateMutation.isPending}
              onClick={stopEditing}
            >
              Cancel
            </ActionButton>
          </div>
        </form>
      ) : profile ? (
        <div className="flex flex-col gap-4">
          <SummaryDetailList
            details={[
              { label: "Registered name", value: profile.legalName },
              { label: "Trading name", value: profile.tradingName },
              {
                label: "Facility type",
                value: findOptionLabel(organizationTypeOptions, profile.type),
              },
              { label: "CAC number", value: profile.cacNumber },
              { label: "Email address", value: profile.email },
              { label: "Phone number", value: profile.phone },
              {
                label: "Address",
                value:
                  [
                    profile.addressLine,
                    profile.city,
                    profile.lga,
                    findOptionLabel(nigerianStateOptions, profile.stateCode),
                  ]
                    .filter(Boolean)
                    .join(", ") || null,
              },
              {
                label: "Facility licence number",
                value: profile.facilityLicenceNo,
              },
              {
                label: "HealthAlyst directory",
                value: profile.directoryListed ? "Listed" : "Not listed",
              },
            ]}
          />
          {savedMessage && (
            <FormMessage tone={savedMessage.tone}>
              {savedMessage.text}
            </FormMessage>
          )}
          {!canEdit && (
            <HintText>
              Ask an organisation administrator to change these details.
            </HintText>
          )}
        </div>
      ) : null}
    </section>
  );
}
