"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRightIcon, CheckIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { DynamicFormFields } from "@healthalyst/ui/components/dynamic-form-fields";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@healthalyst/ui/components/card";
import { FieldError } from "@healthalyst/ui/components/field";
import { validateFormData } from "@healthalyst/ui/lib/form-definition";
import {
  organizationRegistrationFormDefinition,
  organizationTypeOptions,
  type OrganizationType,
} from "~/lib/organization-registration-form-definition";

type RegistrationResponse = {
  applicationId: string;
  status: "PENDING_REVIEW";
};

function isRegistrationResponse(
  responseValue: unknown
): responseValue is RegistrationResponse {
  if (typeof responseValue !== "object" || responseValue === null) {
    return false;
  }

  return (
    "applicationId" in responseValue &&
    typeof responseValue.applicationId === "string" &&
    "status" in responseValue &&
    responseValue.status === "PENDING_REVIEW"
  );
}

function isOrganizationType(value: string): value is OrganizationType {
  return organizationTypeOptions.some(
    (organizationType) => organizationType.value === value
  );
}

export default function OrganizationRegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [registrationResponse, setRegistrationResponse] =
    useState<RegistrationResponse | null>(null);

  async function handleRegistrationSubmit(
    formEvent: FormEvent<HTMLFormElement>
  ) {
    formEvent.preventDefault();
    setErrorMessage(null);

    const validationResult = validateFormData(
      organizationRegistrationFormDefinition,
      new FormData(formEvent.currentTarget)
    );
    if (!validationResult.valid) {
      setFieldErrors(validationResult.errors);
      const firstInvalidField = Object.keys(validationResult.errors)[0];
      if (firstInvalidField) {
        const control =
          formEvent.currentTarget.elements.namedItem(firstInvalidField);
        if (control instanceof HTMLElement) control.focus();
      }
      return;
    }

    const registrationValues = validationResult.values;
    if (registrationValues.password !== registrationValues.confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match." });
      const confirmPasswordControl =
        formEvent.currentTarget.elements.namedItem("confirmPassword");
      if (confirmPasswordControl instanceof HTMLElement) {
        confirmPasswordControl.focus();
      }
      return;
    }

    const administratorName = `${registrationValues.firstName} ${registrationValues.lastName}`;
    if (administratorName.length > 120) {
      setFieldErrors({
        lastName:
          "First and last name together must be no more than 120 characters.",
      });
      const lastNameControl =
        formEvent.currentTarget.elements.namedItem("lastName");
      if (lastNameControl instanceof HTMLElement) {
        lastNameControl.focus();
      }
      return;
    }

    const organizationTypeValue = registrationValues.organizationType;
    if (!isOrganizationType(organizationTypeValue)) {
      setFieldErrors({ organizationType: "Select a valid organisation type." });
      return;
    }

    setFieldErrors({});
    const apiAddress = process.env.NEXT_PUBLIC_HEALTHALYST_API_URL;

    if (!apiAddress) {
      setErrorMessage(
        "Registration is not connected yet. Contact your HealthAlyst administrator for setup help."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${apiAddress.replace(/\/$/, "")}/api/v1/organization-registrations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            organizationName: registrationValues.organizationName,
            organizationType: organizationTypeValue,
            registrationNumber: registrationValues.registrationNumber,
            countryCode: "NG",
            administratorName,
            emailAddress: registrationValues.emailAddress,
            password: registrationValues.password,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(
            "An account or organisation with these details already exists. Sign in or contact support for help."
          );
        }
        if (response.status === 400) {
          const errorPayload: unknown = await response.json().catch(() => null);
          if (
            typeof errorPayload === "object" &&
            errorPayload !== null &&
            "message" in errorPayload &&
            typeof errorPayload.message === "string"
          ) {
            throw new Error(errorPayload.message);
          }
          throw new Error("Check the details and correct the form fields.");
        }
        throw new Error(
          "We could not submit the application. Try again shortly."
        );
      }

      const responseBody: unknown = await response.json();
      if (!isRegistrationResponse(responseBody)) {
        throw new Error(
          "We received an unexpected response. Contact HealthAlyst for help."
        );
      }
      setRegistrationResponse(responseBody);
    } catch (submissionError) {
      setErrorMessage(
        submissionError instanceof Error
          ? submissionError.message
          : "We could not connect to HealthAlyst. Check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
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
              setFieldErrors((currentErrors) => {
                if (
                  !currentErrors[fieldName] &&
                  !(fieldName === "password" && currentErrors.confirmPassword)
                ) {
                  return currentErrors;
                }
                const updatedErrors = { ...currentErrors };
                delete updatedErrors[fieldName];
                if (fieldName === "password") {
                  delete updatedErrors.confirmPassword;
                }
                return updatedErrors;
              });
              setErrorMessage(null);
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
              trailingIcon={<ArrowRightIcon aria-hidden="true" />}
            >
              Submit for verification
            </ActionButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
