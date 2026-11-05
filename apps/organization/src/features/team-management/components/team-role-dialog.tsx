"use client";

import { useState, type FormEvent } from "react";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { CheckboxField } from "@healthalyst/ui/components/checkbox-field";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { LabelledControlGroup } from "@healthalyst/ui/components/labelled-control-group";
import { TextField } from "@healthalyst/ui/components/text-field";
import { TEAM_FIELD_LIMITS } from "~/features/team-management/config/team-management";
import type { TeamScope } from "~/features/team-management/hooks/use-team-members";
import {
  useTeamRoleCreateMutation,
  useTeamRoleUpdateMutation,
} from "~/features/team-management/hooks/use-team-roles";
import { teamRoleFormSchema } from "~/features/team-management/schemas/team-form-schemas";
import type {
  TeamPermission,
  TeamRole,
} from "~/features/team-management/types/team-management";
import { groupPermissionsByArea } from "~/features/team-management/utilities/describe-team";
import {
  focusFirstInvalidField,
  parseFormData,
} from "~/shared/forms/form-validation";

/**
 * Create a custom role, or edit one when `role` is given. People can only add
 * permissions they hold themselves; ones they lack stay as they are.
 */
export function TeamRoleDialog({
  role,
  open,
  onOpenChange,
  scope,
  catalogue,
  heldPermissions,
}: {
  role: TeamRole | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: TeamScope;
  catalogue: readonly TeamPermission[];
  heldPermissions: readonly string[];
}) {
  const createMutation = useTeamRoleCreateMutation(scope);
  const updateMutation = useTeamRoleUpdateMutation(scope);
  const activeMutation = role ? updateMutation : createMutation;
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const serverFieldErrors =
    activeMutation.error instanceof PlatformApiError
      ? activeMutation.error.fieldErrors
      : {};
  const visibleFieldErrors = { ...serverFieldErrors, ...fieldErrors };
  const savedPermissions = new Set(role?.permissions ?? []);
  const heldPermissionSet = new Set(heldPermissions);
  const lockedPermissions = [...savedPermissions].filter(
    (permission) => !heldPermissionSet.has(permission)
  );

  function changeOpen(isOpen: boolean) {
    if (!isOpen && activeMutation.isPending) return;
    if (isOpen) {
      activeMutation.reset();
      setFieldErrors({});
    }
    onOpenChange(isOpen);
  }

  function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formElement = formEvent.currentTarget;
    const result = parseFormData(teamRoleFormSchema, new FormData(formElement));
    if (!result.success) {
      setFieldErrors(result.errors);
      focusFirstInvalidField(formElement, result.errors);
      return;
    }
    setFieldErrors({});
    const onSuccess = () => onOpenChange(false);
    if (!role) {
      createMutation.mutate(result.data, { onSuccess });
      return;
    }
    const permissionsChanged =
      result.data.permissions.length !== savedPermissions.size ||
      result.data.permissions.some(
        (permission) => !savedPermissions.has(permission)
      );
    const changes = {
      ...(result.data.name !== role.name && { name: result.data.name }),
      ...(permissionsChanged && { permissions: result.data.permissions }),
    };
    if (Object.keys(changes).length === 0) {
      onOpenChange(false);
      return;
    }
    updateMutation.mutate({ roleId: role.id, changes }, { onSuccess });
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={changeOpen}
      title={role ? `Edit ${role.name}` : "Create a role"}
      description={
        role && role.memberCount > 0
          ? `${role.memberCount} ${role.memberCount === 1 ? "person holds" : "people hold"} this role. Changes apply to them at once.`
          : "Choose what people with this role can see and do."
      }
      submitLabel={role ? "Save role" : "Create role"}
      submittingLabel={role ? "Saving role" : "Creating role"}
      isSubmitting={activeMutation.isPending}
      error={
        activeMutation.error && Object.keys(serverFieldErrors).length === 0
          ? activeMutation.error.message
          : ""
      }
      onSubmit={handleSubmit}
    >
      <TextField
        id="team-role-name"
        label="Role name"
        name="name"
        required
        defaultValue={role?.name ?? ""}
        maxLength={TEAM_FIELD_LIMITS.roleNameMaximumLength}
        placeholder="For example, Senior nurse"
        error={visibleFieldErrors.name}
      />
      {lockedPermissions.map((permission) => (
        // Kept because only someone who holds them can remove them.
        <input
          key={permission}
          type="hidden"
          name="permissions"
          value={permission}
        />
      ))}
      <LabelledControlGroup
        id="team-role-permissions"
        title="Permissions"
        message={
          visibleFieldErrors.permissions ??
          "You can only give permissions you hold yourself."
        }
        messageTone={visibleFieldErrors.permissions ? "error" : "status"}
      >
        <div className="flex flex-col gap-6">
          {groupPermissionsByArea(catalogue).map((area) => (
            <fieldset key={area.key} className="flex flex-col gap-3">
              <legend className="mb-1 text-sm font-medium">{area.label}</legend>
              {area.permissions.map((permission) => {
                const isHeld = heldPermissionSet.has(permission.code);
                return (
                  <CheckboxField
                    key={permission.code}
                    id={`team-role-permission-${permission.code.replace(":", "-")}`}
                    name="permissions"
                    value={permission.code}
                    label={permission.description}
                    description={
                      isHeld
                        ? undefined
                        : "You do not hold this permission, so you cannot change it."
                    }
                    defaultChecked={savedPermissions.has(permission.code)}
                    disabled={!isHeld}
                  />
                );
              })}
            </fieldset>
          ))}
        </div>
      </LabelledControlGroup>
    </FormDialog>
  );
}
