"use client";

import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ChevronRightIcon } from "@healthalyst/icons";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@healthalyst/ui/components/alert";
import { DynamicFormFields } from "@healthalyst/ui/components/dynamic-form-fields";
import { Card, CardContent, CardFooter } from "@healthalyst/ui/components/card";
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

  return (
    <Card className="overflow-hidden rounded-2xl shadow-none">
      <form
        ref={form.formReference}
        onSubmit={form.handleSubmit}
        noValidate
        aria-busy={
          isLoadingReferences ||
          form.updateMutation.isPending ||
          form.isReloading
        }
      >
        <CardContent className="flex flex-col gap-8 p-5 sm:p-8">
          {referenceError && (
            <Alert variant="destructive">
              <AlertTitle>We could not load the form options</AlertTitle>
              <AlertDescription>
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
              </AlertDescription>
            </Alert>
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
            <Alert variant="destructive">
              <AlertTitle>
                {form.hasConflict
                  ? "These details changed elsewhere"
                  : "Your details could not be saved"}
              </AlertTitle>
              <AlertDescription>
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
              </AlertDescription>
            </Alert>
          )}
          {form.reloadError && (
            <p role="alert" className="text-sm text-destructive">
              {form.reloadError}
            </p>
          )}
        </CardContent>
        {application.canEdit && (
          <CardFooter className="flex flex-col gap-4 border-t border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p
              role="status"
              className="max-w-sm text-sm leading-6 text-muted-foreground"
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
          </CardFooter>
        )}
      </form>
    </Card>
  );
}
