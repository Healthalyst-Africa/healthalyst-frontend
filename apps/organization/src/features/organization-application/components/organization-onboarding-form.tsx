"use client";

import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ChevronRightIcon } from "@healthalyst/icons";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { DynamicFormFields } from "@healthalyst/ui/components/dynamic-form-fields";
import { FormMessage } from "@healthalyst/ui/components/form-message";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { createOrganizationOnboardingFormDefinition } from "~/features/organization-application/config/organization-onboarding-form";
import { useOrganizationOnboardingForm } from "~/features/organization-application/hooks/use-organization-onboarding-form";
import {
  usePlatformNigerianStatesQuery,
  usePlatformOrganizationTypesQuery,
} from "~/features/organization-registration/hooks/use-platform-reference-data";
import { organizationTypeOptions } from "~/shared/organization/config/organization-reference";
import type { OrganizationApplication } from "~/features/organization-application/types/organization-application";

export function OrganizationOnboardingForm(properties: {
  application: OrganizationApplication;
  organizationId: string;
  userId: string;
  reloadApplication: () => Promise<OrganizationApplication | undefined>;
  onContinue: () => void;
}) {
  const { application } = properties;
  const organizationTypesQuery = usePlatformOrganizationTypesQuery();
  const statesQuery = usePlatformNigerianStatesQuery();
  const form = useOrganizationOnboardingForm(properties);
  const referenceError = organizationTypesQuery.error ?? statesQuery.error;
  const isLoadingReferences =
    organizationTypesQuery.isPending || statesQuery.isPending;
  const isContinueLinkDisabled =
    form.hasConflict ||
    isLoadingReferences ||
    Boolean(referenceError) ||
    form.isReloading;
  const definition = createOrganizationOnboardingFormDefinition(
    organizationTypeOptions.filter((option) =>
      organizationTypesQuery.data?.some(
        (reference) => reference.type === option.value
      )
    ),
    statesQuery.data?.map((state) => ({
      value: state.code,
      label: state.name,
    })) ?? []
  );

  const formIdentifier = `organization-onboarding-form-${application.id}`;

  return (
    <ContentPanel
      className="overflow-hidden rounded-2xl"
      elevation="flat"
      spacing="compact"
      footer={
        application.canEdit && (
          <>
            <p
              role="status"
              className="max-w-sm text-xs leading-5 text-muted-foreground"
            >
              {form.saveMessage ||
                (form.hasChanges
                  ? "You have unsaved changes."
                  : "Your details are saved. You can update them before submission.")}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {form.hasChanges && (
                <ActionButton
                  type="button"
                  variant="ghost"
                  disabled={form.updateMutation.isPending || form.isReloading}
                  onClick={form.discardChanges}
                >
                  Discard changes
                </ActionButton>
              )}
              {!form.hasChanges && application.checklist.profileComplete ? (
                <a
                  href="#onboarding-content"
                  aria-disabled={isContinueLinkDisabled}
                  className="inline-flex min-h-11 items-center gap-1.5 text-sm font-normal text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-disabled:text-muted-foreground"
                  onClick={(clickEvent) => {
                    if (isContinueLinkDisabled) {
                      clickEvent.preventDefault();
                      return;
                    }

                    clickEvent.preventDefault();

                    properties.onContinue();
                  }}
                >
                  Continue to account verification
                  <ChevronRightIcon
                    aria-hidden="true"
                    className="size-4 shrink-0"
                  />
                </a>
              ) : (
                <ActionButton
                  type="submit"
                  form={formIdentifier}
                  isLoading={form.updateMutation.isPending}
                  loadingText="Saving and continuing"
                  disabled={
                    (!form.hasChanges &&
                      !application.checklist.profileComplete) ||
                    form.hasConflict ||
                    isLoadingReferences ||
                    Boolean(referenceError) ||
                    form.isReloading
                  }
                >
                  {form.hasChanges
                    ? "Save and continue"
                    : "Complete organisation details"}
                </ActionButton>
              )}
            </div>
          </>
        )
      }
    >
      <form
        id={formIdentifier}
        ref={form.formReference}
        className="flex flex-col gap-8"
        onSubmit={form.handleSubmit}
        noValidate
        aria-busy={
          isLoadingReferences ||
          form.updateMutation.isPending ||
          form.isReloading
        }
      >
        {referenceError && (
          <NoticeBanner tone="error" title="We could not load the form options">
            <p>{referenceError.message}</p>
            <ActionButton
              type="button"
              variant="outline"
              onClick={() => {
                void organizationTypesQuery.refetch();
                void statesQuery.refetch();
              }}
            >
              Try again
            </ActionButton>
          </NoticeBanner>
        )}
        <DynamicFormFields
          definition={definition}
          values={form.values}
          onValueChange={form.changeValue}
          errors={form.fieldErrors}
          disabled={
            !application.canEdit ||
            form.updateMutation.isPending ||
            isLoadingReferences ||
            Boolean(referenceError) ||
            form.isReloading
          }
          fieldGroupClassName="sm:gap-x-6"
          sectionHeadingSize="large"
        />
        {form.updateMutation.error && (
          <NoticeBanner
            tone="error"
            title={
              form.hasConflict
                ? "These details changed elsewhere"
                : "Your details could not be saved"
            }
          >
            <p>
              {form.hasConflict
                ? "Load the latest saved details. Your edits will be kept so you can review them before saving again."
                : form.updateMutation.error.message}
            </p>
            {form.hasConflict && (
              <ActionButton
                type="button"
                variant="outline"
                isLoading={form.isReloading}
                onClick={() => void form.reloadLatestDetails()}
              >
                Load latest details
              </ActionButton>
            )}
          </NoticeBanner>
        )}
        {form.reloadError && (
          <FormMessage tone="error">{form.reloadError}</FormMessage>
        )}
      </form>
    </ContentPanel>
  );
}
