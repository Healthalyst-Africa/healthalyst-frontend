"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DeleteIcon,
  OpenDocumentIcon,
  UploadDocumentIcon,
} from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { FileActionList } from "@healthalyst/ui/components/file-action-list";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { LoadingPlaceholder } from "@healthalyst/ui/components/loading-placeholder";
import {
  NoticeBanner,
  StateNotice,
} from "@healthalyst/ui/components/notice-banner";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { formatFileSize } from "@healthalyst/ui/lib/file-size";
import { DocumentDropIllustration } from "@healthalyst/ui/illustrations/document-drop-illustration";
import { UploadDocumentDialog } from "~/features/patients/components/upload-document-dialog";
import {
  DOCUMENT_CATEGORY_OPTIONS,
  DOCUMENT_STATUS_PRESENTATION,
  DOCUMENT_UPLOAD_LIMITS,
} from "~/features/patients/config/patients";
import {
  useDocumentActions,
  useDocuments,
  useOpenDocument,
} from "~/features/patients/hooks/use-patient-record-sections";
import {
  removeDocumentFormSchema,
  type RemoveDocumentFormValues,
} from "~/features/patients/schemas/patient-form-schemas";
import type { PatientDocument } from "~/features/patients/schemas/patient-response-schemas";
import { describeDate } from "~/features/patients/utilities/patient-presentation";
import {
  canOpenDocument,
  describeDocumentTitle,
  readDocumentPermissions,
} from "~/features/patients/utilities/document-access";
import { applyFieldErrors } from "~/shared/forms/apply-field-errors";
import { focusFirstInvalidField } from "~/shared/forms/focus-first-invalid-field";
import { useWorkspace } from "~/shared/workspace/workspace-context";

function describeFileType(document: PatientDocument): string {
  if (document.contentType === "application/pdf") return "PDF";
  return document.contentType === "image/png" ? "PNG" : "JPEG";
}

function describeDocumentDetails(document: PatientDocument): string {
  const category =
    DOCUMENT_CATEGORY_OPTIONS.find(
      (option) => option.value === document.category
    )?.label ?? document.category;
  return [
    document.title ? category : null,
    formatFileSize(document.sizeBytes),
    `added ${describeDate(document.createdAt)}`,
    document.clinical ? "clinical staff only" : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Registration papers, referral letters and results from elsewhere. */
export function DocumentsSection({ patientId }: { patientId: string }) {
  const permissions = readDocumentPermissions(useWorkspace().permissions);
  const documentsQuery = useDocuments(patientId);
  const actions = useDocumentActions(patientId);
  const { mutation: openMutation, openDocument } = useOpenDocument(patientId);
  const [isUploading, setIsUploading] = useState(false);
  const [isStorageUnavailable, setIsStorageUnavailable] = useState(false);
  const [removingDocument, setRemovingDocument] =
    useState<PatientDocument | null>(null);

  const documents = (documentsQuery.data ?? []).filter(
    (document) => document.status !== "REMOVED"
  );
  const canUpload = permissions.canUpload && !isStorageUnavailable;

  return (
    <ContentPanel
      heading="Documents"
      headingLevel={2}
      description="Referral letters and results from elsewhere open for clinical staff only."
      headingAccessory={
        canUpload && (
          <ActionButton
            type="button"
            variant="outline"
            size="small"
            leadingIcon={<UploadDocumentIcon className="size-4" />}
            onClick={() => setIsUploading(true)}
          >
            Upload
          </ActionButton>
        )
      }
    >
      {documentsQuery.isPending ? (
        <LoadingPlaceholder
          label="Loading documents"
          rows={[{ shape: "card" }, { shape: "card" }]}
        />
      ) : documentsQuery.isError ? (
        <StateNotice
          tone="error"
          title="We could not load the documents"
          action={
            <ActionButton
              type="button"
              variant="outline"
              onClick={() => void documentsQuery.refetch()}
            >
              Try again
            </ActionButton>
          }
        >
          <p>{documentsQuery.error.message}</p>
        </StateNotice>
      ) : documents.length === 0 ? (
        <StateNotice
          tone="information"
          title="No documents yet"
          illustration={<DocumentDropIllustration />}
        >
          <p>
            {canUpload
              ? "Upload ID documents, signed consent forms, referral letters or results the patient brings."
              : "Documents uploaded for this patient will appear here."}
          </p>
        </StateNotice>
      ) : (
        <>
          {openMutation.isError && (
            <NoticeBanner tone="error" title="The document did not open">
              {openMutation.error.message}
            </NoticeBanner>
          )}
          <FileActionList
            maximumVisibleItems={5}
            items={documents.map((document) => ({
              key: document.id,
              title: describeDocumentTitle(document),
              details: describeDocumentDetails(document),
              fileTypeLabel: describeFileType(document),
              status:
                document.status === "CLEAN"
                  ? undefined
                  : DOCUMENT_STATUS_PRESENTATION[document.status],
              action: (
                <div className="flex flex-wrap gap-2">
                  {document.status === "CLEAN" &&
                    canOpenDocument(document, permissions) && (
                      <ActionButton
                        type="button"
                        variant="outline"
                        size="small"
                        leadingIcon={<OpenDocumentIcon className="size-4" />}
                        isLoading={
                          openMutation.isPending &&
                          openMutation.variables === document.id
                        }
                        loadingText="Opening"
                        onClick={() => openDocument(document.id)}
                      >
                        Open
                      </ActionButton>
                    )}
                  {permissions.canUpload && (
                    <ActionButton
                      type="button"
                      variant="ghost"
                      size="small"
                      leadingIcon={<DeleteIcon className="size-4" />}
                      onClick={() => {
                        actions.remove.reset();
                        setRemovingDocument(document);
                      }}
                    >
                      Remove
                      <span className="sr-only">
                        {` ${describeDocumentTitle(document)}`}
                      </span>
                    </ActionButton>
                  )}
                </div>
              ),
            }))}
          />
        </>
      )}
      {isStorageUnavailable && (
        <NoticeBanner tone="information" title="Uploads are not set up yet">
          Document uploads are not turned on for this organisation. Ask
          HealthAlyst support to set them up.
        </NoticeBanner>
      )}
      {permissions.canUpload && (
        <>
          <UploadDocumentDialog
            patientId={patientId}
            open={isUploading}
            onOpenChange={setIsUploading}
            onStorageUnavailable={() => setIsStorageUnavailable(true)}
          />
          <RemoveDocumentDialog
            document={removingDocument}
            onOpenChange={(open) => {
              if (!open) setRemovingDocument(null);
            }}
            mutation={actions.remove}
          />
        </>
      )}
    </ContentPanel>
  );
}

const EMPTY_REMOVAL: RemoveDocumentFormValues = { reason: "" };

function RemoveDocumentDialog({
  document,
  onOpenChange,
  mutation,
}: {
  document: PatientDocument | null;
  onOpenChange: (open: boolean) => void;
  mutation: ReturnType<typeof useDocumentActions>["remove"];
}) {
  const form = useForm<RemoveDocumentFormValues>({
    resolver: zodResolver(removeDocumentFormSchema),
    defaultValues: EMPTY_REMOVAL,
    shouldFocusError: false,
  });
  const errors = form.formState.errors;

  useEffect(() => {
    if (document) form.reset(EMPTY_REMOVAL);
    // Reset only when a different document is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document]);

  const submit = form.handleSubmit(
    (values) => {
      if (!document) return;
      mutation.mutate(
        { documentId: document.id, reason: values.reason.trim() },
        {
          onSuccess: () => {
            announceSuccess("Document removed");
            onOpenChange(false);
          },
          onError: (error) =>
            applyFieldErrors(error, form.setError, ["reason"]),
        }
      );
    },
    (invalidFields) =>
      focusFirstInvalidField(invalidFields, {
        reason: "remove-document-reason",
      })
  );

  return (
    <FormDialog
      open={document !== null}
      onOpenChange={onOpenChange}
      title={
        document
          ? `Remove “${describeDocumentTitle(document)}”`
          : "Remove document"
      }
      description="It is hidden from the record. The file is kept, and the removal is recorded with your reason."
      submitLabel="Remove document"
      submittingLabel="Removing"
      tone="destructive"
      isSubmitting={mutation.isPending}
      error={
        mutation.isError && Object.keys(errors).length === 0
          ? mutation.error.message
          : undefined
      }
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      <TextAreaField
        id="remove-document-reason"
        label="Reason"
        required
        description="Such as “uploaded to the wrong patient”."
        rows={2}
        maxLength={DOCUMENT_UPLOAD_LIMITS.removeReason.maximum}
        error={errors.reason?.message}
        {...form.register("reason")}
      />
    </FormDialog>
  );
}
