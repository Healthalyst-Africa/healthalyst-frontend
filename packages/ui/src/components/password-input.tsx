"use client";

import { forwardRef, useState, type ComponentProps } from "react";
import { HidePasswordIcon, ShowPasswordIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@healthalyst/ui/components/input-group";
import { cn } from "@healthalyst/ui/lib/utilities";

type PasswordInputProperties = Omit<
  ComponentProps<typeof InputGroupInput>,
  "type"
> & {
  visibilityLabel: string;
  borderless?: boolean;
};

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProperties>(
  (
    { visibilityLabel, borderless = false, disabled, id, ...properties },
    elementReference
  ) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const VisibilityIcon = isPasswordVisible
      ? HidePasswordIcon
      : ShowPasswordIcon;

    return (
      <InputGroup
        className={cn(borderless && "border-0")}
        data-disabled={disabled}
      >
        <InputGroupInput
          {...properties}
          ref={elementReference}
          id={id}
          type={isPasswordVisible ? "text" : "password"}
          disabled={disabled}
        />
        <InputGroupAddon align="inline-end">
          <ActionButton
            type="button"
            variant="ghost"
            size="icon"
            className="[&_svg]:size-4"
            disabled={disabled}
            aria-label={`${isPasswordVisible ? "Hide" : "Show"} ${visibilityLabel.toLowerCase()}`}
            aria-controls={id}
            aria-pressed={isPasswordVisible}
            onClick={() =>
              setIsPasswordVisible((currentVisibility) => !currentVisibility)
            }
          >
            <VisibilityIcon aria-hidden="true" />
          </ActionButton>
        </InputGroupAddon>
      </InputGroup>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
export type { PasswordInputProperties };
