"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { Button } from "@healthalyst/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@healthalyst/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@healthalyst/ui/components/field";
import { Input } from "@healthalyst/ui/components/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@healthalyst/ui/components/native-select";

type OrganizationType =
  "HOSPITAL" | "CLINIC" | "DIAGNOSTIC_CENTRE" | "LABORATORY" | "PHARMACY";

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

const organizationTypes: Array<{ value: OrganizationType; label: string }> = [
  { value: "HOSPITAL", label: "Hospital" },
  { value: "CLINIC", label: "Clinic" },
  { value: "DIAGNOSTIC_CENTRE", label: "Diagnostic centre" },
  { value: "LABORATORY", label: "Laboratory" },
  { value: "PHARMACY", label: "Pharmacy" },
];

export default function OrganizationRegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registrationResponse, setRegistrationResponse] =
    useState<RegistrationResponse | null>(null);

  async function handleRegistrationSubmit(
    formEvent: FormEvent<HTMLFormElement>
  ) {
    formEvent.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(formEvent.currentTarget);
    const apiAddress = process.env.NEXT_PUBLIC_HEALTHALYST_API_URL;
    const passwordValue = formData.get("password");

    if (
      typeof passwordValue !== "string" ||
      new TextEncoder().encode(passwordValue).length > 72
    ) {
      setErrorMessage("Use a password that is no longer than 72 UTF-8 bytes.");
      return;
    }

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
            organizationName: formData.get("organizationName"),
            organizationType: formData.get("organizationType"),
            registrationNumber: formData.get("registrationNumber"),
            countryCode: "NG",
            administratorName: formData.get("administratorName"),
            emailAddress: formData.get("emailAddress"),
            password: formData.get("password"),
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
            <Check aria-hidden="true" />
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
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Organisation application
        </p>
        <CardTitle className="font-serif text-2xl">
          Create your administrator account
        </CardTitle>
        <CardDescription className="text-sm leading-6">
          The person registering becomes the first administrator for this
          organisation.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-7 md:px-9 md:pb-9">
        <form
          className="flex flex-col gap-6"
          onSubmit={handleRegistrationSubmit}
        >
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel htmlFor="organizationName">
                Registered organisation name
              </FieldLabel>
              <Input
                autoComplete="organization"
                id="organizationName"
                name="organizationName"
                maxLength={160}
                placeholder="As shown on your registration documents"
                required
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="organizationType">
                  Organisation type
                </FieldLabel>
                <NativeSelect
                  id="organizationType"
                  name="organizationType"
                  defaultValue=""
                  required
                >
                  <NativeSelectOption value="" disabled>
                    Select a type
                  </NativeSelectOption>
                  {organizationTypes.map((organizationType) => (
                    <NativeSelectOption
                      key={organizationType.value}
                      value={organizationType.value}
                    >
                      {organizationType.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="registrationNumber">
                  Registration number
                </FieldLabel>
                <Input
                  autoComplete="off"
                  id="registrationNumber"
                  name="registrationNumber"
                  maxLength={64}
                  placeholder="Organisation registration ID"
                  required
                />
              </Field>
            </div>

            <div className="border-t border-border pt-5">
              <h3 className="text-sm font-semibold">Administrator details</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Use the person’s own work email. This account will manage the
                organisation after approval.
              </p>
            </div>

            <Field>
              <FieldLabel htmlFor="administratorName">Full name</FieldLabel>
              <Input
                autoComplete="name"
                id="administratorName"
                name="administratorName"
                maxLength={120}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="emailAddress">Work email address</FieldLabel>
              <Input
                autoComplete="email"
                id="emailAddress"
                name="emailAddress"
                type="email"
                maxLength={254}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                autoComplete="new-password"
                id="password"
                name="password"
                type="password"
                minLength={12}
                maxLength={72}
                required
              />
              <FieldDescription>
                Use at least 12 characters and no more than 72 UTF-8 bytes.
              </FieldDescription>
            </Field>
          </FieldGroup>

          {errorMessage && <FieldError>{errorMessage}</FieldError>}

          <div className="flex flex-col gap-3 border-t border-border pt-5">
            <p className="text-xs leading-5 text-muted-foreground">
              By submitting, you confirm that you are authorised to register
              this organisation. Do not include patient or clinical information.
            </p>
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <LoaderCircle aria-hidden="true" className="animate-spin" />
              ) : (
                <ArrowRight aria-hidden="true" data-icon="inline-end" />
              )}
              {isSubmitting
                ? "Submitting application"
                : "Submit for verification"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
