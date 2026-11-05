"use client";

import { useState } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { CheckboxMatrix } from "@healthalyst/ui/components/checkbox-matrix";
import { FormMessage } from "@healthalyst/ui/components/form-message";
import { SectionHeading } from "@healthalyst/ui/components/section-heading";
import { usePlatformBranchCapabilitiesMutation } from "~/features/organization-management/hooks/use-platform-organization";
import type {
  PlatformBranch,
  PlatformBranchCapability,
} from "~/features/organization-management/types/organization-management";
import { BRANCH_CAPABILITY_OPTIONS } from "~/features/organization-settings/config/organization-settings";
import { completeBranchCapabilities } from "~/features/organization-settings/utilities/organization-settings-changes";

const OFFERED_COLUMN = "offered";
const REFERRALS_COLUMN = "referrals";

function capabilitiesMatch(
  firstCapabilities: readonly PlatformBranchCapability[],
  secondCapabilities: readonly PlatformBranchCapability[]
): boolean {
  return firstCapabilities.every((capability, capabilityIndex) => {
    const other = secondCapabilities[capabilityIndex];
    return (
      other?.isEnabled === capability.isEnabled &&
      other.acceptsExternalReferrals === capability.acceptsExternalReferrals
    );
  });
}

/** What the branch offers and takes referrals for, edited in place. */
export function BranchServicesSection({
  branch,
  organizationId,
  userId,
  canManage,
}: {
  branch: PlatformBranch;
  organizationId: string;
  userId: string;
  canManage: boolean;
}) {
  const capabilitiesMutation = usePlatformBranchCapabilitiesMutation({
    organizationId,
    userId,
  });
  const savedCapabilities = completeBranchCapabilities(branch.capabilities);
  const [draft, setDraft] = useState(savedCapabilities);
  const hasChanges = !capabilitiesMatch(draft, savedCapabilities);

  function updateCapability(
    category: string,
    columnKey: string,
    isChecked: boolean
  ) {
    capabilitiesMutation.reset();
    setDraft((currentDraft) =>
      currentDraft.map((capability) => {
        if (capability.category !== category) return capability;
        if (columnKey === OFFERED_COLUMN) {
          // A branch cannot take referrals for a service it does not offer.
          return {
            ...capability,
            isEnabled: isChecked,
            acceptsExternalReferrals:
              isChecked && capability.acceptsExternalReferrals,
          };
        }
        return { ...capability, acceptsExternalReferrals: isChecked };
      })
    );
  }

  return (
    <section
      aria-labelledby="branch-services-heading"
      className="flex flex-col gap-4"
    >
      <SectionHeading
        headingIdentifier="branch-services-heading"
        heading="Services"
        description="What people can book at this branch, and which services other organisations can refer patients to."
      />
      <CheckboxMatrix
        accessibleLabel={`Services at ${branch.name}`}
        rowHeading="Service"
        columns={[
          { key: OFFERED_COLUMN, label: "Offered here" },
          { key: REFERRALS_COLUMN, label: "Takes referrals" },
        ]}
        rows={BRANCH_CAPABILITY_OPTIONS.map((option) => {
          const capability = draft.find(
            (candidate) => candidate.category === option.category
          );
          return {
            key: option.category,
            label: option.label,
            values: {
              [OFFERED_COLUMN]: { checked: capability?.isEnabled ?? false },
              [REFERRALS_COLUMN]: {
                checked: capability?.acceptsExternalReferrals ?? false,
                disabled: !capability?.isEnabled,
              },
            },
          };
        })}
        disabled={!canManage || capabilitiesMutation.isPending}
        onCheckedChange={updateCapability}
      />
      {canManage && (
        <div className="flex flex-wrap items-center gap-3">
          <ActionButton
            type="button"
            disabled={!hasChanges}
            isLoading={capabilitiesMutation.isPending}
            loadingText="Saving services"
            onClick={() =>
              capabilitiesMutation.mutate({
                branchId: branch.id,
                capabilities: draft,
              })
            }
          >
            Save services
          </ActionButton>
          {hasChanges && !capabilitiesMutation.isPending && (
            <ActionButton
              type="button"
              variant="outline"
              onClick={() => {
                capabilitiesMutation.reset();
                setDraft(savedCapabilities);
              }}
            >
              Undo changes
            </ActionButton>
          )}
          {capabilitiesMutation.isSuccess && !hasChanges && (
            <FormMessage tone="success">Services saved.</FormMessage>
          )}
          {capabilitiesMutation.error && (
            <FormMessage tone="error">
              {capabilitiesMutation.error.message}
            </FormMessage>
          )}
        </div>
      )}
    </section>
  );
}
