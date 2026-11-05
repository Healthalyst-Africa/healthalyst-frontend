"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { PageBreadcrumbs } from "@healthalyst/ui/components/page-breadcrumbs";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { EditIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { BrandLoader } from "@healthalyst/ui/components/brand-loader";
import { CheckboxField } from "@healthalyst/ui/components/checkbox-field";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { StateNotice } from "@healthalyst/ui/components/notice-banner";
import { TextField } from "@healthalyst/ui/components/text-field";
import { PageNotFoundIllustration } from "@healthalyst/ui/illustrations/page-not-found-illustration";
import { BRAND_MARK_SOURCE } from "~/config/brand";
import { ORGANIZATION_ROUTES } from "~/config/routes";
import {
  usePlatformBranchesQuery,
  usePlatformBranchUpdateMutation,
} from "~/features/organization-management/hooks/use-platform-organization";
import type { PlatformBranch } from "~/features/organization-management/types/organization-management";
import { BranchDepartmentsSection } from "~/features/organization-settings/components/branch-departments-section";
import { BranchServicesSection } from "~/features/organization-settings/components/branch-services-section";
import {
  OrganizationSettingsFrame,
  type OrganizationSettingsContext,
} from "~/features/organization-settings/components/organization-settings-frame";
import { BRANCH_FIELD_LIMITS } from "~/features/organization-settings/config/organization-settings";
import { branchEditFormSchema } from "~/features/organization-settings/schemas/organization-settings-schemas";
import {
  focusFirstInvalidField,
  parseFormData,
} from "~/shared/forms/form-validation";

const BACK_LINK_CLASS_NAME =
  "w-fit text-sm font-semibold text-primary underline underline-offset-4 hover:no-underline";

/** One branch's services and departments. */
export function BranchSettingsPage({ branchId }: { branchId: string }) {
  return (
    <OrganizationSettingsFrame>
      {(settings) => <BranchSettings settings={settings} branchId={branchId} />}
    </OrganizationSettingsFrame>
  );
}

function BranchSettings({
  settings,
  branchId,
}: {
  settings: OrganizationSettingsContext;
  branchId: string;
}) {
  const branchesQuery = usePlatformBranchesQuery({
    organizationId: settings.organizationId,
    userId: settings.userId,
  });
  const branch = branchesQuery.data?.find(
    (candidate) => candidate.id === branchId
  );

  if (branchesQuery.isPending) {
    return (
      <BrandLoader
        markSource={BRAND_MARK_SOURCE}
        label="Loading the branch"
        presentation="inline"
      />
    );
  }

  if (branchesQuery.isError || !branch) {
    return (
      <StateNotice
        tone="error"
        illustration={branch ? undefined : <PageNotFoundIllustration />}
        title={
          branchesQuery.isError
            ? "We could not load this branch"
            : "This branch is not in your organisation"
        }
        action={
          branchesQuery.isError ? (
            <ActionButton
              type="button"
              variant="outline"
              onClick={() => void branchesQuery.refetch()}
            >
              Try again
            </ActionButton>
          ) : (
            <Link
              className={BACK_LINK_CLASS_NAME}
              href={ORGANIZATION_ROUTES.organizationSettings}
            >
              See your branches
            </Link>
          )
        }
      >
        {branchesQuery.isError
          ? branchesQuery.error.message
          : "The link may be out of date. Choose the branch from your list of branches."}
      </StateNotice>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <BranchHeader branch={branch} settings={settings} />
      <BranchServicesSection
        branch={branch}
        organizationId={settings.organizationId}
        userId={settings.userId}
        canManage={settings.canManageBranches}
      />
      <BranchDepartmentsSection
        branch={branch}
        organizationId={settings.organizationId}
        userId={settings.userId}
        canManage={settings.canManageBranches}
      />
    </div>
  );
}

function BranchHeader({
  branch,
  settings,
}: {
  branch: PlatformBranch;
  settings: OrganizationSettingsContext;
}) {
  const updateMutation = usePlatformBranchUpdateMutation({
    organizationId: settings.organizationId,
    userId: settings.userId,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const serverFieldErrors =
    updateMutation.error instanceof PlatformApiError
      ? updateMutation.error.fieldErrors
      : {};

  function handleEdit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formElement = formEvent.currentTarget;
    const result = parseFormData(
      branchEditFormSchema,
      new FormData(formElement)
    );
    if (!result.success) {
      setFieldErrors(result.errors);
      focusFirstInvalidField(formElement, result.errors);
      return;
    }
    setFieldErrors({});
    const changes = {
      ...(result.data.name !== branch.name && { name: result.data.name }),
      ...(result.data.isActive !== branch.isActive && {
        isActive: result.data.isActive,
      }),
    };
    if (Object.keys(changes).length === 0) {
      setIsEditing(false);
      return;
    }
    updateMutation.mutate(
      { branchId: branch.id, changes },
      { onSuccess: () => setIsEditing(false) }
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-2">
        <PageBreadcrumbs
          linkComponent={Link}
          trail={[
            { label: "Products", href: ORGANIZATION_ROUTES.products },
            {
              label: "Organisation settings",
              href: ORGANIZATION_ROUTES.organizationSettings,
            },
          ]}
          currentPage={branch.name}
        />
      </div>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="font-serif text-display font-normal [overflow-wrap:anywhere]">
            {branch.name}
          </h1>
          {!branch.isActive && (
            <p className="max-w-2xl text-lede text-muted-foreground">
              This branch is inactive. People cannot choose it for new work
              until it is turned back on.
            </p>
          )}
        </div>
        {settings.canManageBranches && (
          <ActionButton
            type="button"
            variant="outline"
            leadingIcon={<EditIcon className="size-4" />}
            onClick={() => {
              updateMutation.reset();
              setFieldErrors({});
              setIsEditing(true);
            }}
          >
            Edit branch
          </ActionButton>
        )}
      </div>

      <FormDialog
        open={isEditing}
        onOpenChange={(isOpen) =>
          !isOpen && !updateMutation.isPending && setIsEditing(false)
        }
        title="Edit branch"
        submitLabel="Save branch"
        submittingLabel="Saving branch"
        isSubmitting={updateMutation.isPending}
        error={
          updateMutation.error && Object.keys(serverFieldErrors).length === 0
            ? updateMutation.error.message
            : ""
        }
        onSubmit={handleEdit}
      >
        <TextField
          id="branch-edit-name"
          label="Branch name"
          name="name"
          required
          maxLength={BRANCH_FIELD_LIMITS.nameMaximumLength}
          defaultValue={branch.name}
          error={fieldErrors.name ?? serverFieldErrors.name}
        />
        <CheckboxField
          id="branch-edit-active"
          name="isActive"
          label="Active"
          description="People can choose this branch for new work. Turn it off to stop that; you can turn it back on later."
          defaultChecked={branch.isActive}
        />
      </FormDialog>
    </div>
  );
}
