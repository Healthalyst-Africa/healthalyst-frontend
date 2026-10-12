"use client";

import { useState, type FormEvent } from "react";
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@healthalyst/ui/components/field";
import { Input } from "@healthalyst/ui/components/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@healthalyst/ui/components/native-select";

type SessionResponse = {
  accessToken: string;
  tokenType: "Bearer";
  expiresInSeconds: number;
};

type ApplicationStatus = {
  applicationId: string;
  organizationName: string;
  status: "PENDING_REVIEW" | "CHANGES_REQUESTED" | "APPROVED" | "REJECTED";
  reviewNote?: string | null;
};

type OrganizationChoice = {
  organizationId: string;
  organizationName: string;
};

type OrganizationSelectionRequiredResponse = {
  message: string;
  organizations: OrganizationChoice[];
};

function isOrganizationSelectionRequiredResponse(
  responseValue: unknown
): responseValue is OrganizationSelectionRequiredResponse {
  if (
    typeof responseValue !== "object" ||
    responseValue === null ||
    !("organizations" in responseValue) ||
    !Array.isArray(responseValue.organizations)
  ) {
    return false;
  }

  return responseValue.organizations.every(
    (organizationChoice: unknown) =>
      typeof organizationChoice === "object" &&
      organizationChoice !== null &&
      "organizationId" in organizationChoice &&
      typeof organizationChoice.organizationId === "string" &&
      "organizationName" in organizationChoice &&
      typeof organizationChoice.organizationName === "string"
  );
}

function isSessionResponse(
  responseValue: unknown
): responseValue is SessionResponse {
  if (typeof responseValue !== "object" || responseValue === null) {
    return false;
  }

  return (
    "accessToken" in responseValue &&
    typeof responseValue.accessToken === "string" &&
    "tokenType" in responseValue &&
    responseValue.tokenType === "Bearer"
  );
}

function isApplicationStatus(
  responseValue: unknown
): responseValue is ApplicationStatus {
  if (typeof responseValue !== "object" || responseValue === null) {
    return false;
  }

  return (
    "applicationId" in responseValue &&
    typeof responseValue.applicationId === "string" &&
    "organizationName" in responseValue &&
    typeof responseValue.organizationName === "string" &&
    "status" in responseValue &&
    typeof responseValue.status === "string" &&
    responseValue.status in statusLabels &&
    (!("reviewNote" in responseValue) ||
      responseValue.reviewNote === null ||
      typeof responseValue.reviewNote === "string")
  );
}

const statusLabels: Record<ApplicationStatus["status"], string> = {
  PENDING_REVIEW: "Pending review",
  CHANGES_REQUESTED: "More information requested",
  APPROVED: "Approved",
  REJECTED: "Not approved",
};

export default function OrganizationStatusLookup() {
  const [applicationStatus, setApplicationStatus] =
    useState<ApplicationStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState<OrganizationChoice[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");

  async function handleSignIn(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setErrorMessage(null);
    setApplicationStatus(null);
    setIsLoading(true);

    const apiAddress = process.env.NEXT_PUBLIC_HEALTHALYST_API_URL;
    if (!apiAddress) {
      setErrorMessage(
        "Sign-in is not connected. Contact your HealthAlyst administrator."
      );
      setIsLoading(false);
      return;
    }

    const formData = new FormData(formEvent.currentTarget);
    const baseAddress = apiAddress.replace(/\/$/, "");

    try {
      const sessionResponse = await fetch(
        `${baseAddress}/api/v1/auth/session`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emailAddress: formData.get("emailAddress"),
            password: formData.get("password"),
            ...(selectedOrganizationId
              ? { organizationId: selectedOrganizationId }
              : {}),
          }),
        }
      );

      if (sessionResponse.status === 409) {
        const selectionBody: unknown = await sessionResponse.json();
        if (isOrganizationSelectionRequiredResponse(selectionBody)) {
          setOrganizations(selectionBody.organizations);
          setErrorMessage(null);
          return;
        }
      }

      if (!sessionResponse.ok) {
        throw new Error("Email or password is incorrect.");
      }

      const sessionBody: unknown = await sessionResponse.json();
      if (!isSessionResponse(sessionBody)) {
        throw new Error(
          "We received an unexpected sign-in response. Try again."
        );
      }
      const session = sessionBody;
      const applicationResponse = await fetch(
        `${baseAddress}/api/v1/organization-registrations/mine`,
        {
          headers: {
            Authorization: `${session.tokenType} ${session.accessToken}`,
          },
        }
      );

      if (!applicationResponse.ok) {
        throw new Error(
          "We could not load the organisation application. Try again."
        );
      }

      const applicationBody: unknown = await applicationResponse.json();
      if (!isApplicationStatus(applicationBody)) {
        throw new Error(
          "We received an unexpected application status. Try again."
        );
      }
      setApplicationStatus(applicationBody);
    } catch (signInError) {
      setErrorMessage(
        signInError instanceof Error
          ? signInError.message
          : "We could not connect. Check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="gap-2 px-6 pt-7 md:px-9 md:pt-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Administrator sign-in
        </p>
        <CardTitle className="font-serif text-2xl">
          Check your application
        </CardTitle>
        <CardDescription className="text-sm leading-6">
          Sign in with the administrator account used to register your
          organisation.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-7 md:px-9 md:pb-9">
        <form className="flex flex-col gap-5" onSubmit={handleSignIn}>
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel htmlFor="emailAddress">Work email address</FieldLabel>
              <Input
                autoComplete="email"
                id="emailAddress"
                name="emailAddress"
                type="email"
                required
              />
            </Field>
            {organizations.length > 0 && (
              <Field>
                <FieldLabel htmlFor="organizationId">
                  Choose an organisation
                </FieldLabel>
                <NativeSelect
                  id="organizationId"
                  name="organizationId"
                  value={selectedOrganizationId}
                  onChange={(changeEvent) =>
                    setSelectedOrganizationId(changeEvent.target.value)
                  }
                  required
                >
                  <NativeSelectOption value="" disabled>
                    Select an organisation
                  </NativeSelectOption>
                  {organizations.map((organizationChoice) => (
                    <NativeSelectOption
                      key={organizationChoice.organizationId}
                      value={organizationChoice.organizationId}
                    >
                      {organizationChoice.organizationName}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                autoComplete="current-password"
                id="password"
                name="password"
                type="password"
                required
              />
            </Field>
          </FieldGroup>
          {errorMessage && <FieldError>{errorMessage}</FieldError>}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        {applicationStatus && (
          <section
            className="mt-7 border-t border-border pt-6"
            aria-live="polite"
          >
            <h2 className="font-serif text-xl font-semibold">
              {applicationStatus.organizationName}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Status:{" "}
              <span className="font-medium text-foreground">
                {statusLabels[applicationStatus.status]}
              </span>
            </p>
            {applicationStatus.reviewNote && (
              <p className="mt-4 rounded-md border border-border bg-background p-4 text-sm leading-6">
                {applicationStatus.reviewNote}
              </p>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Reference:{" "}
              <span className="font-mono">
                {applicationStatus.applicationId}
              </span>
            </p>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
