"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { DynamicFormFields } from "@healthalyst/ui/components/dynamic-form-fields";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@healthalyst/ui/components/card";
import { FieldError } from "@healthalyst/ui/components/field";
import { useRegisterOrganizationMutation } from "~/features/organization-onboarding/hooks/use-register-organization";
import { organizationRegistrationFormDefinition } from "~/features/organization-onboarding/components/organization-registration-form-definition";
import {
  focusFirstInvalidField,
  parseFormData,
} from "~/shared/forms/form-validation";
import {
  clearRegistrationFieldErrors,
  organizationRegistrationSchema,
} from "~/features/organization-onboarding/model/organization-registration-schema";

export default function OrganizationRegistrationForm() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const registrationMutation = useRegisterOrganizationMutation();
  const registrationResponse = registrationMutation.data;
  const errorMessage = registrationMutation.error?.message;
  const isSubmitting = registrationMutation.isPending;

  function handleRegistrationSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    registrationMutation.reset();

    const validationResult = parseFormData(
      organizationRegistrationSchema,
      new FormData(formEvent.currentTarget)
    );
    if (!validationResult.success) {
      setFieldErrors(validationResult.errors);
      focusFirstInvalidField(formEvent.currentTarget, validationResult.errors);
      return;
    }

    setFieldErrors({});
    registrationMutation.mutate(validationResult.data);
  }

  if (registrationResponse) {
    return (
      <Card className="self-start border-border bg-card shadow-sm">
        <CardContent className="flex flex-col items-start gap-5 px-6 py-10 md:px-9">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
            <CheckIcon aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-2">
            <h2 className="font-serif text-2xl font-semibold">
              Application received
            </h2>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              Your organisation is waiting for verification. HealthSchedule
              access will remain unavailable until the application is reviewed.
            </p>
          </div>
          <div className="w-full rounded-md border border-border bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Application reference
            </p>
            <p className="mt-1 break-all font-mono text-sm">
              {registrationResponse.applicationId}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Current status:{" "}
            <span className="font-medium text-foreground">Pending review</span>
          </p>
          <Link
            className="text-sm font-semibold text-primary underline underline-offset-4"
            href="/sign-in"
          >
            Sign in to check your application status
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="self-start border-border bg-card shadow-sm">
      <CardHeader className="gap-2 px-6 pt-7 md:px-9 md:pt-9">
        <CardTitle className="font-serif text-2xl">
          Create your administrator account
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-7 md:px-9 md:pb-9">
        <form
          className="flex flex-col gap-6"
          onSubmit={handleRegistrationSubmit}
          noValidate
        >
          <DynamicFormFields
            definition={organizationRegistrationFormDefinition}
            errors={fieldErrors}
            disabled={isSubmitting}
            onFieldChange={(fieldName) => {
              setFieldErrors((currentErrors) =>
                clearRegistrationFieldErrors(currentErrors, fieldName)
              );
              registrationMutation.reset();
            }}
          />

          {errorMessage && <FieldError>{errorMessage}</FieldError>}

          <div className="flex flex-col gap-3 border-t border-border pt-5">
            <p className="text-xs leading-5 text-muted-foreground">
              By submitting, you confirm that you are authorised to register
              this organisation. Do not include patient or clinical information.
            </p>
            <ActionButton
              className="w-full"
              size="large"
              type="submit"
              isLoading={isSubmitting}
              loadingText="Submitting application"
            >
              Submit for verification
            </ActionButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
