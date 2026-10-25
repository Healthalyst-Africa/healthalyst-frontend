"use client";

import { useId, useState, type ReactNode } from "react";
import {
  DeleteIcon,
  InformationIcon,
  LoaderIcon,
  ReplaceFileIcon,
} from "@healthalyst/icons";
import {
  FileStatusText,
  FileTile,
} from "@healthalyst/ui/components/file-display/file-display";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { FieldLabelText } from "@healthalyst/ui/components/forms/field-label-text";
import {
  Dropzone,
  useDropzoneState,
  useFilePicker,
  type FileRejection,
} from "@healthalyst/ui/primitives/dropzone";
import { formatFileSize } from "@healthalyst/ui/lib/file-size";
import { cn } from "@healthalyst/ui/lib/utilities";
import type { StatusTone } from "@healthalyst/ui/types/status-tone";

type FileUploadFieldItem = {
  identifier: string;
  fileName: string;
  /** A short file type shown on the file tile, such as "PDF" or "PNG". */
  fileTypeLabel?: string;
  /** An image address for a thumbnail, such as an object URL or a view link. */
  previewUrl?: string;
  /** Short facts about the file, such as its size. */
  details?: string;
  status?: { label: string; tone: StatusTone };
  /** Guidance shown under the file, such as why it was rejected. */
  message?: string;
  /** Shows a remove action when provided. */
  onRemove?: () => void;
  isRemoving?: boolean;
};

type FileUploadFieldProperties = {
  identifier: string;
  label: string;
  /** Marks the field with an asterisk and announces it as required. */
  required?: boolean;
  /** Guidance shown below the drop target, such as which document to upload. */
  hint?: ReactNode;
  /** Content beside the label, such as a summary status. */
  labelAccessory?: ReactNode;
  /** Accepted media types and their extensions, in react-dropzone's format. */
  accept: Readonly<Record<string, readonly string[]>>;
  maximumSizeBytes: number;
  /** The accepted formats in words, such as "PDF, JPEG or PNG". */
  formatsDescription: string;
  files: readonly FileUploadFieldItem[];
  /** Whether the drop target is offered; hide it once nothing more is needed. */
  canAddFile?: boolean;
  /** The name of the file being uploaded, which replaces the drop target. */
  uploadingFileName?: string;
  disabled?: boolean;
  /** An error from the application, such as a failed upload. */
  error?: string;
  /** A decorative illustration from `@healthalyst/ui/illustrations/*`. */
  illustration?: ReactNode;
  onFileAccepted: (file: File) => void;
  /** Called when a dropped or chosen file is refused, after the field shows why. */
  onFileRejected?: (message: string) => void;
  className?: string;
};

/**
 * A labelled single-file upload with a drag-and-drop target, the files already
 * added and their statuses. Applications supply the upload behaviour and
 * statuses; the field validates type, size and count before accepting a file.
 */
export function FileUploadField({
  identifier,
  label,
  required = false,
  hint,
  labelAccessory,
  accept,
  maximumSizeBytes,
  formatsDescription,
  files,
  canAddFile = true,
  uploadingFileName,
  disabled = false,
  error,
  illustration,
  onFileAccepted,
  onFileRejected,
  className,
}: FileUploadFieldProperties) {
  const [rejectionMessage, setRejectionMessage] = useState("");
  const generatedIdentifier = useId();
  const labelIdentifier = `${identifier}-label-${generatedIdentifier}`;
  const formatsIdentifier = `${identifier}-formats-${generatedIdentifier}`;
  const errorIdentifier = `${identifier}-error-${generatedIdentifier}`;
  const hintIdentifier = `${identifier}-hint-${generatedIdentifier}`;
  const shownError = error || rejectionMessage;
  const maximumSizeLabel = formatFileSize(maximumSizeBytes);

  function describeRejection(fileRejections: FileRejection[]): string {
    const errorCode = fileRejections[0]?.errors[0]?.code;
    if (errorCode === "file-invalid-type") {
      return `This file type is not accepted. Use ${formatsDescription}.`;
    }
    if (errorCode === "file-too-large") {
      return `This file is larger than ${maximumSizeLabel}. Choose a smaller file.`;
    }
    if (errorCode === "too-many-files") return "Add one file at a time.";
    return "This file could not be added. Choose another file.";
  }

  const dropzoneAccept = Object.fromEntries(
    Object.entries(accept).map(([mediaType, extensions]) => [
      mediaType,
      [...extensions],
    ])
  );

  function handleFilesAccepted(acceptedFiles: File[]) {
    const acceptedFile = acceptedFiles[0];
    if (!acceptedFile) return;
    setRejectionMessage("");
    onFileAccepted(acceptedFile);
  }

  function handleFilesRejected(fileRejections: FileRejection[]) {
    const message = describeRejection(fileRejections);
    setRejectionMessage(message);
    onFileRejected?.(message);
  }

  // Once a file is added, it is replaced from its row rather than a second
  // drop target.
  const {
    openFilePicker,
    getInputProperties,
    getRootProperties,
    isDragActive: isReplacementDragActive,
  } = useFilePicker({
    accept: dropzoneAccept,
    maxSize: maximumSizeBytes,
    disabled,
    onFilesAccepted: handleFilesAccepted,
    onFilesRejected: handleFilesRejected,
  });
  const hasFiles = files.length > 0;
  const showsDropTarget = canAddFile && !hasFiles && !uploadingFileName;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p id={labelIdentifier} className="text-sm font-medium">
          <FieldLabelText label={label} required={required} announceRequired />
        </p>
        {shownError ? (
          <p
            id={errorIdentifier}
            role="alert"
            className="text-xs font-normal text-destructive sm:text-right"
          >
            {shownError}
          </p>
        ) : (
          labelAccessory
        )}
      </div>

      {hasFiles && (
        <div
          {...(canAddFile && !uploadingFileName ? getRootProperties() : {})}
          className="relative rounded-lg"
        >
          <ul className="flex flex-col gap-2" aria-label={`${label} files`}>
            {files.map((file) => (
              <FileUploadFieldRow
                key={file.identifier}
                file={file}
                onReplace={
                  canAddFile && !uploadingFileName ? openFilePicker : undefined
                }
              />
            ))}
          </ul>
          {isReplacementDragActive && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg border border-primary bg-secondary/90 text-sm font-medium text-primary">
              Drop to replace
            </div>
          )}
        </div>
      )}

      {hasFiles && canAddFile && <input {...getInputProperties()} />}

      {uploadingFileName && (
        <div
          role="status"
          className={cn(
            "flex items-center gap-3 rounded-lg border border-dashed border-primary/40 bg-secondary/40 text-sm",
            hasFiles
              ? "px-4 py-3"
              : "min-h-44 flex-col justify-center px-6 py-8 text-center"
          )}
        >
          <LoaderIcon
            aria-hidden="true"
            className="size-5 shrink-0 animate-spin text-primary motion-reduce:animate-none"
          />
          <span className="min-w-0 [overflow-wrap:anywhere]">
            Uploading {uploadingFileName}
          </span>
        </div>
      )}

      {showsDropTarget && (
        <Dropzone
          accept={dropzoneAccept}
          maxSize={maximumSizeBytes}
          maxFiles={1}
          disabled={disabled}
          aria-labelledby={labelIdentifier}
          aria-describedby={[
            formatsIdentifier,
            hint ? hintIdentifier : "",
            shownError ? errorIdentifier : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onFilesAccepted={handleFilesAccepted}
          onFilesRejected={handleFilesRejected}
          className="rounded-lg"
        >
          <FileUploadDropTarget
            illustration={illustration}
            hasFiles={hasFiles}
            hasError={Boolean(shownError)}
            formatsIdentifier={formatsIdentifier}
            formatsLabel={`${formatsDescription}, up to ${maximumSizeLabel}`}
          />
        </Dropzone>
      )}

      {hint && showsDropTarget && (
        <p
          id={hintIdentifier}
          className="-mt-1.5 flex items-start gap-1.5 text-xs italic leading-5 text-muted-foreground"
        >
          <InformationIcon
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
          />
          <span>{hint}</span>
        </p>
      )}
    </div>
  );
}

function FileUploadDropTarget({
  illustration,
  hasFiles,
  hasError,
  formatsIdentifier,
  formatsLabel,
}: {
  illustration?: ReactNode;
  hasFiles: boolean;
  hasError: boolean;
  formatsIdentifier: string;
  formatsLabel: string;
}) {
  const { isDragActive, isDragReject } = useDropzoneState();

  return (
    <div
      className={cn(
        "flex min-h-44 flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-8 text-center transition-colors duration-150 motion-reduce:transition-none",
        "border-muted-foreground/40 bg-secondary/20 hover:border-primary/60 hover:bg-secondary/40",
        isDragActive && "border-solid border-primary bg-secondary",
        (isDragReject || hasError) && "border-destructive/60"
      )}
    >
      {illustration && (
        <div
          aria-hidden="true"
          className="w-16 shrink-0 [&_svg]:h-auto [&_svg]:w-full"
        >
          {illustration}
        </div>
      )}
      <div className="flex min-w-0 flex-col items-center gap-1">
        <p className="text-sm text-foreground">
          {isDragActive ? (
            "Drop the file to upload it"
          ) : (
            <>
              {hasFiles
                ? "Drag a replacement here or "
                : "Drag a file here or "}
              <span className="font-semibold text-primary underline underline-offset-4">
                browse files
              </span>
            </>
          )}
        </p>
        <p id={formatsIdentifier} className="text-xs text-muted-foreground">
          {formatsLabel}
        </p>
      </div>
    </div>
  );
}

function FileUploadFieldRow({
  file,
  onReplace,
}: {
  file: FileUploadFieldItem;
  onReplace?: () => void;
}) {
  const isNegative = file.status?.tone === "negative";

  return (
    <li className="flex items-center gap-3 rounded-lg border bg-card px-3 py-3 sm:px-4">
      <FileTile
        previewUrl={file.previewUrl}
        fileTypeLabel={file.fileTypeLabel}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm font-medium leading-5 [overflow-wrap:anywhere]">
          {file.fileName}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-5">
          {file.details && (
            <span className="text-muted-foreground">{file.details}</span>
          )}
          {file.status && (
            <FileStatusText label={file.status.label} tone={file.status.tone} />
          )}
        </div>
        {file.message && (
          <p
            className={cn(
              "text-xs leading-5",
              isNegative ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {file.message}
          </p>
        )}
      </div>
      {onReplace && (
        <ActionButton
          type="button"
          size="icon"
          variant="ghost"
          className="size-9 shrink-0 text-primary"
          onClick={onReplace}
          aria-label={`Replace ${file.fileName}`}
          title="Replace file"
        >
          <ReplaceFileIcon aria-hidden="true" className="size-4" />
        </ActionButton>
      )}
      {file.onRemove && (
        <ActionButton
          type="button"
          size="icon"
          variant="ghost"
          className="size-9 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
          isLoading={file.isRemoving}
          onClick={file.onRemove}
          aria-label={`Remove ${file.fileName}`}
          title="Remove file"
        >
          {!file.isRemoving && (
            <DeleteIcon aria-hidden="true" className="size-4" />
          )}
        </ActionButton>
      )}
    </li>
  );
}

export type { FileUploadFieldItem, FileUploadFieldProperties };
