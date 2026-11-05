"use client";

import { useState, type FormEvent } from "react";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { AddIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { CheckboxField } from "@healthalyst/ui/components/checkbox-field";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { SectionHeading } from "@healthalyst/ui/components/section-heading";
import { TextField } from "@healthalyst/ui/components/text-field";
import { EmptyOrganizationsIllustration } from "@healthalyst/ui/illustrations/empty-organizations-illustration";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
import {
  usePlatformDepartmentCreateMutation,
  usePlatformDepartmentUpdateMutation,
} from "~/features/organization-management/hooks/use-platform-organization";
import type {
  PlatformBranch,
  PlatformDepartment,
} from "~/features/organization-management/types/organization-management";
import { BRANCH_FIELD_LIMITS } from "~/features/organization-settings/config/organization-settings";
import {
  departmentCreationFormSchema,
  departmentEditFormSchema,
} from "~/features/organization-settings/schemas/organization-settings-schemas";
import { sortDepartments } from "~/features/organization-settings/utilities/describe-branches";
import {
  focusFirstInvalidField,
  parseFormData,
} from "~/shared/forms/form-validation";

const DEPARTMENT_COLUMNS: readonly DataTableColumn<PlatformDepartment>[] = [
  {
    key: "department",
    label: "Department",
    size: "wide",
    getCell: (department) => ({
      kind: "text",
      primary: department.name,
      secondary: department.isActive ? undefined : "Inactive",
    }),
  },
  {
    key: "code",
    label: "Code",
    size: "compact",
    getCell: (department) => ({ kind: "text", primary: department.code }),
  },
];

/** The branch's departments. Each row opens a form to change it. */
export function BranchDepartmentsSection({
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
  const mutationScope = { organizationId, userId };
  const createMutation = usePlatformDepartmentCreateMutation(mutationScope);
  const updateMutation = usePlatformDepartmentUpdateMutation(mutationScope);
  const [isAdding, setIsAdding] = useState(false);
  const [editingDepartment, setEditingDepartment] =
    useState<PlatformDepartment | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const activeMutation = isAdding ? createMutation : updateMutation;
  const serverFieldErrors =
    activeMutation.error instanceof PlatformApiError
      ? activeMutation.error.fieldErrors
      : {};
  const visibleFieldErrors = { ...serverFieldErrors, ...fieldErrors };
  const dialogError =
    activeMutation.error && Object.keys(serverFieldErrors).length === 0
      ? activeMutation.error.message
      : "";

  function openAdd() {
    createMutation.reset();
    setFieldErrors({});
    setIsAdding(true);
  }

  function openEdit(department: PlatformDepartment) {
    updateMutation.reset();
    setFieldErrors({});
    setEditingDepartment(department);
  }

  function handleAdd(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formElement = formEvent.currentTarget;
    const result = parseFormData(
      departmentCreationFormSchema,
      new FormData(formElement)
    );
    if (!result.success) {
      setFieldErrors(result.errors);
      focusFirstInvalidField(formElement, result.errors);
      return;
    }
    setFieldErrors({});
    createMutation.mutate(
      { branchId: branch.id, department: result.data },
      {
        onSuccess: () => setIsAdding(false),
        onError: (error) => {
          if (error instanceof PlatformApiError) {
            focusFirstInvalidField(formElement, error.fieldErrors);
          }
        },
      }
    );
  }

  function handleEdit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!editingDepartment) return;
    const formElement = formEvent.currentTarget;
    const result = parseFormData(
      departmentEditFormSchema,
      new FormData(formElement)
    );
    if (!result.success) {
      setFieldErrors(result.errors);
      focusFirstInvalidField(formElement, result.errors);
      return;
    }
    setFieldErrors({});
    const changes = {
      ...(result.data.name !== editingDepartment.name && {
        name: result.data.name,
      }),
      ...(result.data.isActive !== editingDepartment.isActive && {
        isActive: result.data.isActive,
      }),
    };
    if (Object.keys(changes).length === 0) {
      setEditingDepartment(null);
      return;
    }
    updateMutation.mutate(
      { departmentId: editingDepartment.id, changes },
      { onSuccess: () => setEditingDepartment(null) }
    );
  }

  return (
    <section
      aria-labelledby="branch-departments-heading"
      className="flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeading
          headingIdentifier="branch-departments-heading"
          heading="Departments"
          description="The teams staff work in at this branch."
        />
        {canManage && branch.departments.length > 0 && (
          <ActionButton
            type="button"
            variant="outline"
            leadingIcon={<AddIcon className="size-4" />}
            onClick={openAdd}
          >
            Add department
          </ActionButton>
        )}
      </div>

      <DataTable
        accessibleLabel={`Departments at ${branch.name}`}
        columns={DEPARTMENT_COLUMNS}
        state={{ status: "ready", rows: sortDepartments(branch.departments) }}
        getRowIdentifier={(department) => department.id}
        rowAction={
          canManage
            ? {
                label: (department) => `Edit ${department.name}`,
                onSelect: openEdit,
              }
            : undefined
        }
        emptyState={{
          illustration: <EmptyOrganizationsIllustration />,
          title: "No departments yet",
          description: canManage
            ? "Add the teams staff work in, such as Outpatients or Pharmacy."
            : "An organisation administrator can add departments.",
          action: canManage ? (
            <ActionButton
              type="button"
              leadingIcon={<AddIcon className="size-4" />}
              onClick={openAdd}
            >
              Add department
            </ActionButton>
          ) : undefined,
        }}
      />

      <FormDialog
        open={isAdding}
        onOpenChange={(isOpen) =>
          !isOpen && !createMutation.isPending && setIsAdding(false)
        }
        title="Add department"
        description={`A team at ${branch.name}.`}
        submitLabel="Add department"
        submittingLabel="Adding department"
        isSubmitting={createMutation.isPending}
        error={dialogError}
        onSubmit={handleAdd}
      >
        <TextField
          id="department-name"
          label="Department name"
          name="name"
          required
          maxLength={BRANCH_FIELD_LIMITS.nameMaximumLength}
          placeholder="For example, Outpatients"
          error={visibleFieldErrors.name}
        />
        <TextField
          id="department-code"
          label="Code"
          name="code"
          required
          description="A short code staff recognise, such as OPD. It cannot be changed later."
          maxLength={BRANCH_FIELD_LIMITS.departmentCodeMaximumLength}
          error={visibleFieldErrors.code}
        />
      </FormDialog>

      <FormDialog
        open={editingDepartment !== null}
        onOpenChange={(isOpen) =>
          !isOpen && !updateMutation.isPending && setEditingDepartment(null)
        }
        title={
          editingDepartment
            ? `Edit ${editingDepartment.name}`
            : "Edit department"
        }
        description={editingDepartment ? `Code ${editingDepartment.code}` : ""}
        submitLabel="Save department"
        submittingLabel="Saving department"
        isSubmitting={updateMutation.isPending}
        error={dialogError}
        onSubmit={handleEdit}
      >
        {editingDepartment && (
          <>
            <TextField
              id="department-edit-name"
              label="Department name"
              name="name"
              required
              maxLength={BRANCH_FIELD_LIMITS.nameMaximumLength}
              defaultValue={editingDepartment.name}
              error={visibleFieldErrors.name}
            />
            <CheckboxField
              id="department-edit-active"
              name="isActive"
              label="Active"
              description="Staff can choose this department for new work. Turn it off to stop that; you can turn it back on later."
              defaultChecked={editingDepartment.isActive}
            />
          </>
        )}
      </FormDialog>
    </section>
  );
}
