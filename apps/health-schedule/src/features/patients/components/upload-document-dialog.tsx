"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { FileUploadField } from "@healthalyst/ui/components/file-upload-field";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { TextField } from "@healthalyst/ui/components/text-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { formatFileSize } from "@healthalyst/ui/lib/file-size";
import { DocumentDropIllustration } from "@healthalyst/ui/illustrations/document-drop-illustration";
import {
  DOCUMENT_ACCEPTED_FILES,
  DOCUMENT_CATEGORY_OPTIONS,
  DOCUMENT_STATUS_PRESENTATION,
  DOCUMENT_UPLOAD_LIMITS,
  PHOTO_ACCEPTED_FILES,
} from "~/features/patients/config/patients";
import { useDocumentActions } from "~/features/patients/hooks/use-patient-record-sections";
import {
  documentUploadFormSchema,
  type DocumentUploadFormValues,
} from "~/features/patients/schemas/patient-form-schemas";
import {
  DOCUMENTS_NOT_CONFIGURED,
  type DocumentUploadStage,
} from "~/features/patients/services/document-service";
import { toDocumentUploadRequest } from "~/features/patients/utilities/patient-requests";
import { applyFieldErrors } from "~/shared/forms/apply-field-errors";
import { focusFirstInvalidField } from "~/shared/forms/focus-first-invalid-field";

/** A preset upload, such as a photo of an insurance card. */
type PresetDocument = {
  category: string;
  /** Saved as the document's title. */
  title: string;
  coverageId?: string;
  dialogTitle: string;
  successMessage: string;
};

function describeStage(stage: DocumentUploadStage, progress: number): string {
  if (stage === "starting") return "Preparing the upload";
  if (stage === "sending")
    return `Sending the file: ${Math.round(progress * 100)}%`;
  return "Checking the file for viruses";
}

function describeFileType(file: File): string {
  return file.type === "application/pdf"
    ? "PDF"
    : file.type === "image/png"
      ? "PNG"
      : "JPEG";
}

/**
 * Uploads one document: the file goes straight to storage, then it is
 * checked for viruses before anyone can open it. With a preset, only the
 * file is asked for.
 */
export function UploadDocumentDialog({
  patientId,
  open,
  onOpenChange,
  preset,
  onStorageUnavailable,
}: {
  patientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preset?: PresetDocument;
  /** Called when the facility has no document storage set up yet. */
  onStorageUnavailable?: () => void;
}) {
  const { upload } = useDocumentActions(patientId);
  const [stage, setStage] = useState<DocumentUploadStage | null>(null);
  const [progress, setProgress] = useState(0);
  const emptyValues: DocumentUploadFormValues = {
    category: preset?.category ?? "",
    title: preset?.title ?? "",
    file: null,
  };
  const form = useForm<DocumentUploadFormValues>({
    resolver: zodResolver(documentUploadFormSchema),
    defaultValues: emptyValues,
    shouldFocusError: false,
  });
  const errors = form.formState.errors;
  const category = form.watch("category");
  const isPhoto = category === "PHOTO";

  useEffect(() => {
    if (open) {
      form.reset(emptyValues);
      upload.reset();
      setStage(null);
      setProgress(0);
    }
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = form.handleSubmit(
    (values) => {
      const file = values.file;
      if (!file) return;
      upload.mutate(
        {
          request: toDocumentUploadRequest(values, file, preset?.coverageId),
          file,
          onStageChange: setStage,
          onProgress: setProgress,
        },
        {
          onSuccess: (document) => {
            setStage(null);
            if (document.status === "CLEAN") {
              announceSuccess(
                preset?.successMessage ?? "Document uploaded and checked"
              );
              onOpenChange(false);
              return;
            }
            form.setError("file", {
              type: "server",
              message: `${DOCUMENT_STATUS_PRESENTATION[document.status].label}. Choose another file.`,
            });
          },
          onError: (error) => {
            setStage(null);
            if (
              error instanceof PlatformApiError &&
              error.code === DOCUMENTS_NOT_CONFIGURED
            ) {
              onStorageUnavailable?.();
              return;
            }
            applyFieldErrors(error, form.setError, [
              "category",
              "title",
              "file",
            ]);
          },
        }
      );
    },
    (invalidFields) =>
      focusFirstInvalidField(invalidFields, {
        category: "document-category",
        title: "document-title",
        file: "document-file",
      })
  );

  const isStorageUnavailable =
    upload.error instanceof PlatformApiError &&
    upload.error.code === DOCUMENTS_NOT_CONFIGURED;

  return (
    <FormDialog
      open={open}
      onOpenChange={(nextOpen) => {
        // Closing mid-upload would leave the file half sent.
        if (!upload.isPending) onOpenChange(nextOpen);
      }}
      title={preset?.dialogTitle ?? "Upload a document"}
      description="Files are checked for viruses before anyone can open them."
      submitLabel="Upload"
      submittingLabel="Uploading"
      isSubmitting={upload.isPending}
      error={
        isStorageUnavailable
          ? "Document uploads are not set up for this organisation yet. Ask HealthAlyst support to turn them on."
          : upload.isError && Object.keys(errors).length === 0
            ? upload.error.message
            : undefined
      }
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      {!preset && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="category"
            render={({ field }) => (
              <SelectField
                id="document-category"
                label="Kind of document"
                required
                placeholder="Choose"
                options={DOCUMENT_CATEGORY_OPTIONS}
                value={field.value}
                onValueChange={field.onChange}
                error={errors.category?.message}
              />
            )}
          />
          <TextField
            id="document-title"
            label="Title"
            description="Such as “Referral from Garki Clinic”."
            autoComplete="off"
            maxLength={DOCUMENT_UPLOAD_LIMITS.titleMaximumLength}
            error={errors.title?.message}
            {...form.register("title")}
          />
        </div>
      )}
      <Controller
        control={form.control}
        name="file"
        render={({ field }) => (
          <div id="document-file" tabIndex={-1} className="outline-none">
            <FileUploadField
              identifier="document-file-field"
              label="File"
              required
              accept={isPhoto ? PHOTO_ACCEPTED_FILES : DOCUMENT_ACCEPTED_FILES}
              maximumSizeBytes={DOCUMENT_UPLOAD_LIMITS.maximumBytes}
              formatsDescription={isPhoto ? "JPEG or PNG" : "PDF, JPEG or PNG"}
              hint={
                preset?.category === "HMO_CARD"
                  ? "A clear photo or scan of the front of the card."
                  : undefined
              }
              illustration={<DocumentDropIllustration />}
              disabled={upload.isPending}
              uploadingFileName={
                stage && field.value ? field.value.name : undefined
              }
              files={
                field.value && !stage
                  ? [
                      {
                        identifier: "chosen-file",
                        fileName: field.value.name,
                        fileTypeLabel: describeFileType(field.value),
                        details: formatFileSize(field.value.size),
                        onRemove: () => field.onChange(null),
                      },
                    ]
                  : []
              }
              error={errors.file?.message}
              onFileAccepted={(file) => {
                form.clearErrors("file");
                field.onChange(file);
              }}
            />
          </div>
        )}
      />
      {stage && (
        <p role="status" className="text-sm text-muted-foreground">
          {describeStage(stage, progress)}
        </p>
      )}
    </FormDialog>
  );
}
