"use client";

import { useState, type FormEvent } from "react";
import { CheckboxField } from "@healthalyst/ui/components/checkbox-field";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { LabelledControlGroup } from "@healthalyst/ui/components/labelled-control-group";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { TextField } from "@healthalyst/ui/components/text-field";
import {
  INVITATION_ACCESS_OPTIONS,
  PARTNER_FIELD_LIMITS,
  SERVICE_CATEGORY_OPTIONS,
} from "~/features/partner-network/config/partner-network";
import { usePartnerInvitationMutation } from "~/features/partner-network/hooks/use-partner-network";
import { partnerInvitationFormSchema } from "~/features/partner-network/schemas/partner-network-schemas";
import type {
  PartnerInvitation,
  PartnerScope,
} from "~/features/partner-network/types/partner-network";
import { organizationTypeOptions } from "~/shared/organization/config/organization-reference";
import {
  focusFirstInvalidField,
  parseFormData,
} from "~/shared/forms/form-validation";

/** Invites an organisation that is not on HealthAlyst to work with you. */
export function InvitePartnerDialog({
  open,
  onOpenChange,
  scope,
  onInvited,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: PartnerScope;
  onInvited: (invitation: PartnerInvitation) => void;
}) {
  const invitationMutation = usePartnerInvitationMutation(scope);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [usesPortal, setUsesPortal] = useState(false);

  function changeOpen(isOpen: boolean) {
    if (!isOpen && invitationMutation.isPending) return;
    if (isOpen) {
      invitationMutation.reset();
      setFieldErrors({});
      setUsesPortal(false);
    }
    onOpenChange(isOpen);
  }

  function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formElement = formEvent.currentTarget;
    const formData = new FormData(formElement);
    formData.set("accessLevel", usesPortal ? "L1_PORTAL_LITE" : "L0_CONTACT");
    const result = parseFormData(partnerInvitationFormSchema, formData);
    if (!result.success) {
      setFieldErrors(result.errors);
      focusFirstInvalidField(formElement, result.errors);
      return;
    }
    setFieldErrors({});
    invitationMutation.mutate(result.data, {
      onSuccess: (invitation) => {
        onOpenChange(false);
        onInvited(invitation);
      },
    });
  }

  const [contactOption, portalOption] = INVITATION_ACCESS_OPTIONS;

  return (
    <FormDialog
      open={open}
      onOpenChange={changeOpen}
      title="Invite an organisation not on HealthAlyst"
      description="We email them a link to register. Once HealthAlyst approves them, your partnership request is waiting for them to accept."
      submitLabel="Send invitation"
      submittingLabel="Sending invitation"
      isSubmitting={invitationMutation.isPending}
      error={invitationMutation.error?.message}
      onSubmit={handleSubmit}
    >
      <TextField
        id="partner-invitation-partnerName"
        label="Organisation name"
        name="partnerName"
        required
        autoComplete="organization"
        maxLength={PARTNER_FIELD_LIMITS.partnerNameMaximumLength}
        error={fieldErrors.partnerName}
      />
      <SelectField
        id="partner-invitation-partnerType"
        label="Type of organisation"
        name="partnerType"
        placeholder="Choose the type"
        options={organizationTypeOptions}
        error={fieldErrors.partnerType}
      />
      <SelectField
        id="partner-invitation-serviceCategory"
        label="Service they will provide to you"
        name="serviceCategory"
        placeholder="Choose the service"
        options={SERVICE_CATEGORY_OPTIONS}
        error={fieldErrors.serviceCategory}
      />
      <TextField
        id="partner-invitation-email"
        label="Email address"
        name="email"
        type="email"
        required
        autoComplete="email"
        maxLength={PARTNER_FIELD_LIMITS.emailMaximumLength}
        error={fieldErrors.email}
      />
      <TextField
        id="partner-invitation-phone"
        label="Phone number"
        description="Optional."
        name="phone"
        type="tel"
        autoComplete="tel"
        error={fieldErrors.phone}
      />
      <LabelledControlGroup
        id="partner-invitation-access"
        title="Access"
        message={
          usesPortal ? portalOption.description : contactOption.description
        }
      >
        <CheckboxField
          id="partner-invitation-portal"
          label={`Give them ${portalOption.label.toLowerCase()} access`}
          checked={usesPortal}
          onCheckedChange={setUsesPortal}
        />
      </LabelledControlGroup>
    </FormDialog>
  );
}
