import { CheckboxField } from "@healthalyst/ui/components/checkbox-field";
import { LabelledControlGroup } from "@healthalyst/ui/components/labelled-control-group";
import {
  GRANTABLE_PLATFORM_ROLES,
  PLATFORM_ROLE_PRESENTATION,
  type GrantablePlatformRole,
} from "~/features/staff-management/config/staff-management";

/** One checkbox per role a super admin can give, each with what it allows. */
export function PlatformRoleFields({
  identifier,
  defaultRoles = [],
  message,
  messageTone,
}: {
  identifier: string;
  defaultRoles?: readonly GrantablePlatformRole[];
  message?: string;
  messageTone?: "status" | "error";
}) {
  return (
    <LabelledControlGroup
      id={`${identifier}-roles`}
      title="Roles"
      message={message}
      messageTone={messageTone}
    >
      <div className="flex flex-col gap-3">
        {GRANTABLE_PLATFORM_ROLES.map((role) => (
          <CheckboxField
            key={role}
            id={`${identifier}-role-${role}`}
            name="roles"
            value={role}
            defaultChecked={defaultRoles.includes(role)}
            label={PLATFORM_ROLE_PRESENTATION[role].label}
            description={PLATFORM_ROLE_PRESENTATION[role].description}
          />
        ))}
      </div>
    </LabelledControlGroup>
  );
}
