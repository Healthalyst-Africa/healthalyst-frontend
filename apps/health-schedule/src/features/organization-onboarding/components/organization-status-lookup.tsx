"use client";

import { useState, type FormEvent } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
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
  AccountsAuthorizationError,
  OrganizationSelectionRequiredError,
  type ApplicationStatus,
  type OrganizationChoice,
} from "~/features/organization-onboarding/api/accounts-service";
import {
  useCreateSessionMutation,
  useMyApplicationQuery,
  type ActiveSession,
} from "~/features/organization-onboarding/hooks/use-application-status";
import {
  clearFieldError,
  focusFirstInvalidField,
  parseFormData,
} from "~/shared/forms/form-validation";
import { createSignInSchema } from "~/features/organization-onboarding/model/sign-in-schema";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@healthalyst/ui/components/select";

const statusLabels: Record<ApplicationStatus["status"], string> = {
  PENDING_REVIEW: "Pending review",
  CHANGES_REQUESTED: "More information requested",
  APPROVED: "Approved",
  REJECTED: "Not approved",
};

export default function OrganizationStatusLookup() {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [organizations, setOrganizations] = useState<OrganizationChoice[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const sessionMutation = useCreateSessionMutation();
  const applicationQuery = useMyApplicationQuery(session);
  const applicationStatus = session ? applicationQuery.data : null;
  const isLoading = sessionMutation.isPending || applicationQuery.isFetching;
  const errorMessage =
    sessionMutation.error instanceof OrganizationSelectionRequiredError
      ? null
      : (sessionMutation.error?.message ?? applicationQuery.error?.message);

  function handleSignIn(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formData = new FormData(formEvent.currentTarget);
    formData.set("organizationId", selectedOrganizationId);
    const validationResult = parseFormData(
      createSignInSchema(organizations.length > 0),
      formData
    );
    if (!validationResult.success) {
      setFieldErrors(validationResult.errors);
      focusFirstInvalidField(formEvent.currentTarget, validationResult.errors);
      return;
    }

    setFieldErrors({});
    sessionMutation.reset();
    setSession(null);

    sessionMutation.mutate(validationResult.data, {
      onSuccess: (sessionResponse) => {
        setOrganizations([]);
        setSession({
          identifier: crypto.randomUUID(),
          response: sessionResponse,
        });
      },
      onError: (error) => {
        if (error instanceof OrganizationSelectionRequiredError) {
          setOrganizations(error.organizations);
        }
      },
    });
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
        <form
          className="flex flex-col gap-5"
          onSubmit={handleSignIn}
          noValidate
        >
          <FieldGroup className="gap-5">
            <Field data-invalid={Boolean(fieldErrors.emailAddress)}>
              <FieldLabel htmlFor="emailAddress">Work email address</FieldLabel>
              <Input
                autoComplete="email"
                id="emailAddress"
                name="emailAddress"
                type="email"
                required
                aria-invalid={Boolean(fieldErrors.emailAddress) || undefined}
                aria-describedby={
                  fieldErrors.emailAddress ? "emailAddress-error" : undefined
                }
                onChange={() =>
                  setFieldErrors((currentErrors) =>
                    clearFieldError(currentErrors, "emailAddress")
                  )
                }
              />
              {fieldErrors.emailAddress && (
                <FieldError id="emailAddress-error">
                  {fieldErrors.emailAddress}
                </FieldError>
              )}
            </Field>
            {organizations.length > 0 && (
              <Field data-invalid={Boolean(fieldErrors.organizationId)}>
                <FieldLabel htmlFor="organizationId">
                  Choose an organisation
                </FieldLabel>
                <Select
                  name="organizationId"
                  value={selectedOrganizationId}
                  onValueChange={(organizationId) => {
                    setSelectedOrganizationId(organizationId);
                    setFieldErrors((currentErrors) =>
                      clearFieldError(currentErrors, "organizationId")
                    );
                  }}
                  required
                >
                  <SelectTrigger
                    id="organizationId"
                    aria-invalid={
                      Boolean(fieldErrors.organizationId) || undefined
                    }
                    aria-describedby={
                      fieldErrors.organizationId
                        ? "organizationId-error"
                        : undefined
                    }
                  >
                    <SelectValue placeholder="Select an organisation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {organizations.map((organizationChoice) => (
                        <SelectItem
                          key={organizationChoice.organizationId}
                          value={organizationChoice.organizationId}
                        >
                          {organizationChoice.organizationName}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {fieldErrors.organizationId && (
                  <FieldError id="organizationId-error">
                    {fieldErrors.organizationId}
                  </FieldError>
                )}
              </Field>
            )}
            <Field data-invalid={Boolean(fieldErrors.password)}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                autoComplete="current-password"
                id="password"
                name="password"
                type="password"
                required
                aria-invalid={Boolean(fieldErrors.password) || undefined}
                aria-describedby={
                  fieldErrors.password ? "password-error" : undefined
                }
                onChange={() =>
                  setFieldErrors((currentErrors) =>
                    clearFieldError(currentErrors, "password")
                  )
                }
              />
              {fieldErrors.password && (
                <FieldError id="password-error">
                  {fieldErrors.password}
                </FieldError>
              )}
            </Field>
          </FieldGroup>
          {errorMessage && <FieldError>{errorMessage}</FieldError>}
          {applicationQuery.isError &&
            session &&
            !(applicationQuery.error instanceof AccountsAuthorizationError) && (
              <ActionButton
                type="button"
                variant="outline"
                onClick={() => void applicationQuery.refetch()}
                disabled={isLoading}
              >
                Retry loading application
              </ActionButton>
            )}
          <ActionButton
            type="submit"
            isLoading={isLoading}
            loadingText="Signing in…"
          >
            Sign in
          </ActionButton>
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
