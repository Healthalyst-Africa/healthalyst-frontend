"use client";

/*
 * Adapted from Kibo UI's Dropzone (https://www.kibo-ui.com/components/dropzone,
 * shadcn registry `@kibo-ui/dropzone`), built on react-dropzone. Changes: the
 * root is a plain element rather than the button primitive, rejections are
 * passed through for the composition to describe, and names follow this
 * repository's naming rules.
 */

import { createContext, useContext, type ReactNode } from "react";
import {
  useDropzone,
  type DropEvent,
  type DropzoneOptions,
  type FileRejection,
} from "react-dropzone";
import { cn } from "@healthalyst/ui/lib/utilities";

type DropzoneContextValue = {
  isDragActive: boolean;
  isDragReject: boolean;
  disabled: boolean;
};

const DropzoneContext = createContext<DropzoneContextValue | undefined>(
  undefined
);

type DropzoneProperties = Omit<
  DropzoneOptions,
  "onDrop" | "onDropAccepted" | "onDropRejected"
> & {
  /** Called with the files that passed `accept`, `maxSize` and `maxFiles`. */
  onFilesAccepted?: (acceptedFiles: File[], event: DropEvent) => void;
  /** Called with each refused file and the reasons react-dropzone refused it. */
  onFilesRejected?: (fileRejections: FileRejection[], event: DropEvent) => void;
  className?: string;
  /** Accessible name and description for the drop target. */
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  children?: ReactNode;
};

/**
 * A keyboard-operable drop target that also opens the file picker on click,
 * Enter or Space.
 */
function Dropzone({
  maxFiles = 1,
  disabled = false,
  onFilesAccepted,
  onFilesRejected,
  className,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  children,
  ...dropzoneOptions
}: DropzoneProperties) {
  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      maxFiles,
      disabled,
      multiple: maxFiles !== 1,
      onDrop: (acceptedFiles, fileRejections, event) => {
        if (fileRejections.length > 0) {
          onFilesRejected?.(fileRejections, event);
          return;
        }
        if (acceptedFiles.length > 0) onFilesAccepted?.(acceptedFiles, event);
      },
      ...dropzoneOptions,
    });

  return (
    <DropzoneContext.Provider value={{ isDragActive, isDragReject, disabled }}>
      <div
        {...getRootProps({
          role: "button",
          "aria-labelledby": ariaLabelledBy,
          "aria-describedby": ariaDescribedBy,
          "aria-disabled": disabled || undefined,
        })}
        data-drag-active={isDragActive || undefined}
        data-drag-reject={isDragReject || undefined}
        data-disabled={disabled || undefined}
        className={cn(
          "relative w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60",
          className
        )}
      >
        <input {...getInputProps()} />
        {children}
      </div>
    </DropzoneContext.Provider>
  );
}

/**
 * Opens the file picker from another control, for actions such as "Replace".
 * Spread `getRootProperties` on a surface to also accept dropped files there.
 * Files go through the same `accept`, `maxSize` and `maxFiles` checks.
 */
function useFilePicker({
  maxFiles = 1,
  onFilesAccepted,
  onFilesRejected,
  ...dropzoneOptions
}: Omit<
  DropzoneProperties,
  "className" | "aria-labelledby" | "aria-describedby" | "children"
>) {
  const { getInputProps, getRootProps, open, isDragActive } = useDropzone({
    maxFiles,
    multiple: maxFiles !== 1,
    noClick: true,
    noKeyboard: true,
    onDrop: (acceptedFiles, fileRejections, event) => {
      if (fileRejections.length > 0) {
        onFilesRejected?.(fileRejections, event);
        return;
      }
      if (acceptedFiles.length > 0) onFilesAccepted?.(acceptedFiles, event);
    },
    ...dropzoneOptions,
  });
  return {
    openFilePicker: open,
    getInputProperties: getInputProps,
    getRootProperties: getRootProps,
    isDragActive,
  };
}

/** The drag state of the surrounding `Dropzone`, for custom content. */
function useDropzoneState(): DropzoneContextValue {
  const context = useContext(DropzoneContext);
  if (!context) throw new Error("useDropzoneState must be used in a Dropzone.");
  return context;
}

export { Dropzone, useDropzoneState, useFilePicker };
export type { DropzoneProperties, FileRejection };
