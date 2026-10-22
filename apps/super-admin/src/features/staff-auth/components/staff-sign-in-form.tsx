"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { Card, CardContent } from "@healthalyst/ui/components/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@healthalyst/ui/components/field";
import { Input } from "@healthalyst/ui/components/input";
import { PasswordInput } from "@healthalyst/ui/components/password-input";
import { createStaffSession } from "~/features/staff-auth/api/staff-service";
import { useStaffSession } from "~/features/staff-auth/context/staff-session-provider";
import { staffSignInSchema } from "~/features/staff-auth/model/staff-sign-in-schema";

export function StaffSignInForm() {
  const router = useRouter();
  const { setStaffIdentity, staffIdentity, status } = useStaffSession();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const signInMutation = useMutation({
    mutationFn: ({
      emailAddress,
      password,
    }: {
      emailAddress: string;
      password: string;
    }) => createStaffSession(emailAddress, password),
    onSuccess: (staffIdentity) => {
      setStaffIdentity(staffIdentity);
      router.replace("/dashboard");
    },
  });

  useEffect(() => {
    if (staffIdentity) router.replace("/dashboard");
  }, [router, staffIdentity]);

  function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formElement = formEvent.currentTarget;
    const formData = new FormData(formElement);
    const result = staffSignInSchema.safeParse({
      emailAddress: formData.get("emailAddress"),
      password: formData.get("password"),
    });
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      setFieldErrors({
        emailAddress: errors.emailAddress?.[0] ?? "",
        password: errors.password?.[0] ?? "",
      });
      const firstInvalidField = formElement.querySelector<HTMLInputElement>(
        `[name="${errors.emailAddress?.length ? "emailAddress" : "password"}"]`
      );
      firstInvalidField?.focus();
      return;
    }
    setFieldErrors({});
    signInMutation.mutate(result.data);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="flex w-full max-w-md flex-col gap-7">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.jpg"
            alt="HealthAlyst Africa"
            width={52}
            height={52}
          />
          <div>
            <p className="font-serif text-xl font-normal">HealthAlyst</p>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Super Admin
            </p>
          </div>
        </div>
        <header className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-serif text-3xl font-normal leading-tight">
            Staff sign in
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Use your HealthAlyst staff account to open the company dashboard.
          </p>
        </header>
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="px-7 py-8">
            <form
              className="flex flex-col gap-5"
              onSubmit={handleSubmit}
              noValidate
            >
              <FieldGroup className="gap-5">
                <Field
                  className="gap-1.5"
                  data-invalid={Boolean(fieldErrors.emailAddress)}
                >
                  <FieldLabel htmlFor="staff-email-address">
                    Work email address
                  </FieldLabel>
                  <Input
                    id="staff-email-address"
                    name="emailAddress"
                    type="email"
                    autoComplete="username"
                    aria-invalid={
                      Boolean(fieldErrors.emailAddress) || undefined
                    }
                    aria-describedby={
                      fieldErrors.emailAddress ? "staff-email-error" : undefined
                    }
                    onChange={() =>
                      setFieldErrors((errors) => ({
                        ...errors,
                        emailAddress: "",
                      }))
                    }
                  />
                  {fieldErrors.emailAddress && (
                    <FieldError id="staff-email-error">
                      {fieldErrors.emailAddress}
                    </FieldError>
                  )}
                </Field>
                <Field
                  className="gap-1.5"
                  data-invalid={Boolean(fieldErrors.password)}
                >
                  <FieldLabel htmlFor="staff-password">Password</FieldLabel>
                  <PasswordInput
                    id="staff-password"
                    name="password"
                    autoComplete="current-password"
                    visibilityLabel="Password"
                    aria-invalid={Boolean(fieldErrors.password) || undefined}
                    aria-describedby={
                      fieldErrors.password ? "staff-password-error" : undefined
                    }
                    onChange={() =>
                      setFieldErrors((errors) => ({ ...errors, password: "" }))
                    }
                  />
                  {fieldErrors.password && (
                    <FieldError id="staff-password-error">
                      {fieldErrors.password}
                    </FieldError>
                  )}
                </Field>
              </FieldGroup>
              {signInMutation.error && (
                <FieldError role="alert">
                  {signInMutation.error.message}
                </FieldError>
              )}
              <ActionButton
                type="submit"
                size="large"
                className="w-full"
                isLoading={signInMutation.isPending || status === "loading"}
                loadingText="Signing in"
              >
                Sign in
              </ActionButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
