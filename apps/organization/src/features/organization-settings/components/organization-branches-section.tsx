"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { AddIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { SectionHeading } from "@healthalyst/ui/components/section-heading";
import { TextField } from "@healthalyst/ui/components/text-field";
import { EmptyOrganizationsIllustration } from "@healthalyst/ui/illustrations/empty-organizations-illustration";
import type {
  DataTableColumn,
  DataTableState,
} from "@healthalyst/ui/types/data-table";
import { getBranchSettingsRoute } from "~/config/routes";
import {
  usePlatformBranchCreateMutation,
  usePlatformBranchesQuery,
} from "~/features/organization-management/hooks/use-platform-organization";
import type { PlatformBranch } from "~/features/organization-management/types/organization-management";
import { BRANCH_FIELD_LIMITS } from "~/features/organization-settings/config/organization-settings";
import { branchCreationFormSchema } from "~/features/organization-settings/schemas/organization-settings-schemas";
import {
  describeBranchDepartments,
  describeBranchServices,
  sortBranches,
} from "~/features/organization-settings/utilities/describe-branches";
import {
  focusFirstInvalidField,
  parseFormData,
} from "~/shared/forms/form-validation";

const BRANCH_COLUMNS: readonly DataTableColumn<PlatformBranch>[] = [
  {
    key: "branch",
    label: "Branch",
    size: "wide",
    getCell: (branch) => ({
      kind: "text",
      primary: branch.name,
      secondary: branch.isActive ? undefined : "Inactive",
    }),
  },
  {
    key: "services",
    label: "Services",
    size: "wide",
    getCell: (branch) => ({
      kind: "text",
      primary: describeBranchServices(branch),
    }),
  },
  {
    key: "departments",
    label: "Departments",
    getCell: (branch) => ({
      kind: "text",
      primary: describeBranchDepartments(branch),
    }),
  },
];

/** The organisation's branches. Each row opens that branch's settings. */
export function OrganizationBranchesSection({
  organizationId,
  userId,
  canManage,
}: {
  organizationId: string;
  userId: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const branchesQuery = usePlatformBranchesQuery({ organizationId, userId });
  const createBranchMutation = usePlatformBranchCreateMutation({
    organizationId,
    userId,
  });
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const serverFieldErrors =
    createBranchMutation.error instanceof PlatformApiError
      ? createBranchMutation.error.fieldErrors
      : {};
  const visibleFieldErrors = { ...serverFieldErrors, ...fieldErrors };

  const state: DataTableState<PlatformBranch> = branchesQuery.isError
    ? {
        status: "error",
        title: "We could not load your branches",
        description: branchesQuery.error.message,
        retryLabel: "Try again",
        onRetry: () => void branchesQuery.refetch(),
      }
    : branchesQuery.isPending
      ? { status: "loading", label: "Loading your branches" }
      : { status: "ready", rows: sortBranches(branchesQuery.data) };

  function openAddBranch() {
    createBranchMutation.reset();
    setFieldErrors({});
    setIsAddingBranch(true);
  }

  function handleAddBranch(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formElement = formEvent.currentTarget;
    const result = parseFormData(
      branchCreationFormSchema,
      new FormData(formElement)
    );
    if (!result.success) {
      setFieldErrors(result.errors);
      focusFirstInvalidField(formElement, result.errors);
      return;
    }
    setFieldErrors({});
    createBranchMutation.mutate(result.data, {
      // The new branch has no services or departments yet; open it to add them.
      onSuccess: (branch) => router.push(getBranchSettingsRoute(branch.id)),
      onError: (error) => {
        if (error instanceof PlatformApiError) {
          focusFirstInvalidField(formElement, error.fieldErrors);
        }
      },
    });
  }

  return (
    <section aria-labelledby="branches-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeading
          headingIdentifier="branches-heading"
          heading="Branches"
          description="The sites your organisation works from, with their services and departments."
        />
        {canManage && (
          <ActionButton
            type="button"
            variant="outline"
            leadingIcon={<AddIcon className="size-4" />}
            onClick={openAddBranch}
          >
            Add branch
          </ActionButton>
        )}
      </div>

      <DataTable
        accessibleLabel="Branches"
        columns={BRANCH_COLUMNS}
        state={state}
        getRowIdentifier={(branch) => branch.id}
        rowAction={{
          label: (branch) => `Open ${branch.name}`,
          onSelect: (branch) => router.push(getBranchSettingsRoute(branch.id)),
        }}
        emptyState={{
          illustration: <EmptyOrganizationsIllustration />,
          title: "No branches yet",
          description: canManage
            ? "Add the sites your organisation works from to set up their services and departments."
            : "An organisation administrator can add your branches.",
          action: canManage ? (
            <ActionButton
              type="button"
              leadingIcon={<AddIcon className="size-4" />}
              onClick={openAddBranch}
            >
              Add branch
            </ActionButton>
          ) : undefined,
        }}
      />

      <FormDialog
        open={isAddingBranch}
        onOpenChange={(isOpen) =>
          !isOpen && !createBranchMutation.isPending && setIsAddingBranch(false)
        }
        title="Add branch"
        description="You can choose its services and add departments next."
        submitLabel="Add branch"
        submittingLabel="Adding branch"
        isSubmitting={createBranchMutation.isPending}
        error={
          createBranchMutation.error &&
          Object.keys(serverFieldErrors).length === 0
            ? createBranchMutation.error.message
            : ""
        }
        onSubmit={handleAddBranch}
      >
        <TextField
          id="branch-name"
          label="Branch name"
          name="name"
          required
          maxLength={BRANCH_FIELD_LIMITS.nameMaximumLength}
          placeholder="For example, Lekki"
          error={visibleFieldErrors.name}
        />
        <TextField
          id="branch-slug"
          label="Short name for links"
          name="slug"
          description="Optional. Lowercase letters, numbers and hyphens. Leave it empty and HealthAlyst makes one from the name."
          maxLength={BRANCH_FIELD_LIMITS.slugMaximumLength}
          placeholder="lekki"
          error={visibleFieldErrors.slug}
        />
      </FormDialog>
    </section>
  );
}
