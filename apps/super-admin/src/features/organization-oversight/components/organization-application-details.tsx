"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@healthalyst/ui/components/field";
import { Input } from "@healthalyst/ui/components/input";
import { Textarea } from "@healthalyst/ui/components/textarea";
import type { StaffIdentity } from "~/features/staff-auth/api/staff-service";
import type {
  OrganizationApplication,
  OrganizationDetail,
} from "~/features/organization-oversight/api/organization-service";
import {
  useOrganizationDetailQuery,
  useOrganizationDocumentViewUrlMutation,
  useReviewDecisionMutation,
} from "~/features/organization-oversight/hooks/use-organization-oversight";
import { requestChangesSchema } from "~/features/organization-oversight/model/review-schemas";

export function OrganizationApplicationDetails({
  application,
  staffIdentity,
  canReview,
}: {
  application: OrganizationApplication;
  staffIdentity: StaffIdentity;
  canReview: boolean;
}) {
  const detailQuery = useOrganizationDetailQuery(staffIdentity, application.id);
  const decisionMutation = useReviewDecisionMutation(staffIdentity);
  const documentViewUrlMutation = useOrganizationDocumentViewUrlMutation();
  const [requestError, setRequestError] = useState("");
  const [viewUrls, setViewUrls] = useState<
    Record<string, { url: string; expiresAt: number }>
  >({});

  useEffect(() => {
    const expiryTimes = Object.values(viewUrls).map(
      (viewUrl) => viewUrl.expiresAt
    );
    if (expiryTimes.length === 0) return;

    const nextExpiryTime = Math.min(...expiryTimes);
    const expiryTimer = window.setTimeout(
      () => {
        const currentTime = Date.now();
        setViewUrls((currentViewUrls) =>
          Object.fromEntries(
            Object.entries(currentViewUrls).filter(
              ([, viewUrl]) => viewUrl.expiresAt > currentTime
            )
          )
        );
      },
      Math.max(0, nextExpiryTime - Date.now())
    );

    return () => window.clearTimeout(expiryTimer);
  }, [viewUrls]);

  function handleRequestChanges(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formElement = formEvent.currentTarget;
    const formData = new FormData(formElement);
    const result = requestChangesSchema.safeParse({
      field: formData.get("field"),
      message: formData.get("message"),
    });
    if (!result.success) {
      setRequestError(
        result.error.issues[0]?.message ?? "Check the requested changes."
      );
      const firstFieldName =
        result.error.issues[0]?.path[0] === "message" ? "message" : "field";
      formElement
        .querySelector<HTMLInputElement | HTMLTextAreaElement>(
          `[name="${firstFieldName}"]`
        )
        ?.focus();
      return;
    }
    const detail = detailQuery.data;
    if (!detail) return;
    setRequestError("");
    decisionMutation.mutate(
      {
        organizationId: application.id,
        decision: {
          status: "CHANGES_REQUESTED",
          version: detail.version,
          items: [result.data],
        },
      },
      { onSuccess: () => formElement.reset() }
    );
  }

  async function handleGetViewUrl(documentId: string) {
    try {
      const documentView = await documentViewUrlMutation.mutateAsync({
        organizationId: application.id,
        documentId,
      });
      setViewUrls((currentUrls) => ({
        ...currentUrls,
        [documentId]: {
          url: documentView.url,
          expiresAt: Date.now() + documentView.expiresIn * 1000,
        },
      }));
    } catch {
      // The request error is shown alongside the document list.
    }
  }

  if (detailQuery.isPending) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Loading application details and uploaded documents…
      </p>
    );
  }

  if (detailQuery.isError) {
    return (
      <div className="flex flex-col items-start gap-2">
        <FieldError role="alert">{detailQuery.error.message}</FieldError>
        <ActionButton
          type="button"
          variant="outline"
          onClick={() => void detailQuery.refetch()}
        >
          Retry loading application details
        </ActionButton>
      </div>
    );
  }

  const detail = detailQuery.data;
  const profileFields = getReadableProfileFields(detail);

  return (
    <section className="flex flex-col gap-5 rounded-lg border border-border bg-muted/30 p-4">
      <div>
        <h3 className="text-lg font-semibold">Application details</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Uploaded documents are provided by the organisation. Secure viewing
          links expire after one minute.
        </p>
      </div>

      {profileFields.length > 0 && (
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {profileFields.map((profileField) => (
            <div key={profileField.label}>
              <dt className="text-xs font-semibold text-muted-foreground">
                {profileField.label}
              </dt>
              <dd className="mt-1 break-words text-sm">{profileField.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div>
        <h4 className="font-semibold">Products requested</h4>
        {detail.products.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No product requests are recorded.
          </p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {detail.products.map((product) => (
              <li
                key={product.code}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs"
              >
                {formatLabel(product.code)} · {formatLabel(product.status)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h4 className="font-semibold">Uploaded documents</h4>
        {detail.documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            The organisation has not uploaded documents yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {detail.documents.map((documentRecord) => (
              <li
                key={documentRecord.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card p-3"
              >
                <div className="min-w-0">
                  <p className="break-all text-sm font-medium">
                    {documentRecord.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatLabel(documentRecord.type)} ·{" "}
                    {formatLabel(documentRecord.status)} ·{" "}
                    {Math.ceil(documentRecord.sizeBytes / 1024)} KB
                  </p>
                </div>
                {viewUrls[documentRecord.id] ? (
                  <a
                    href={viewUrls[documentRecord.id].url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-primary underline underline-offset-4"
                  >
                    Open secure document link
                  </a>
                ) : (
                  <ActionButton
                    type="button"
                    size="small"
                    variant="outline"
                    isLoading={documentViewUrlMutation.isPending}
                    loadingText="Getting link"
                    onClick={() => void handleGetViewUrl(documentRecord.id)}
                  >
                    Get secure view link
                  </ActionButton>
                )}
              </li>
            ))}
          </ul>
        )}
        {documentViewUrlMutation.error && (
          <FieldError role="alert">
            {documentViewUrlMutation.error.message}
          </FieldError>
        )}
      </div>

      {detail.possibleDuplicates.length > 0 && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
          <h4 className="font-semibold">Possible duplicate organisations</h4>
          <ul className="mt-2 space-y-1 text-sm">
            {detail.possibleDuplicates.map((possibleDuplicate) => (
              <li key={possibleDuplicate.id}>
                {possibleDuplicate.legalName} ·{" "}
                {formatLabel(possibleDuplicate.status)}
                {possibleDuplicate.matchedOn.length > 0 &&
                  ` · matched on ${possibleDuplicate.matchedOn.join(", ")}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {canReview && (
        <form
          className="flex flex-col gap-3 border-t border-border pt-4"
          onSubmit={handleRequestChanges}
          noValidate
        >
          <div>
            <h4 className="font-semibold">Request changes</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Send an itemised correction request to the applicant.
            </p>
          </div>
          <Field className="gap-1.5" data-invalid={Boolean(requestError)}>
            <FieldLabel htmlFor={`change-field-${application.id}`}>
              Application field
            </FieldLabel>
            <Input
              id={`change-field-${application.id}`}
              name="field"
              maxLength={100}
              placeholder="For example, facility licence"
              onChange={() => setRequestError("")}
            />
          </Field>
          <Field className="gap-1.5" data-invalid={Boolean(requestError)}>
            <FieldLabel htmlFor={`change-message-${application.id}`}>
              What needs to change?
            </FieldLabel>
            <Textarea
              id={`change-message-${application.id}`}
              name="message"
              rows={3}
              maxLength={500}
              placeholder="Explain what information or document is required."
              onChange={() => setRequestError("")}
            />
          </Field>
          {requestError && <FieldError role="alert">{requestError}</FieldError>}
          {decisionMutation.error && (
            <FieldError role="alert">
              {decisionMutation.error.message}
            </FieldError>
          )}
          {decisionMutation.isSuccess && (
            <p role="status" className="text-sm text-primary">
              Change request sent to the applicant.
            </p>
          )}
          <div>
            <ActionButton
              type="submit"
              variant="outline"
              isLoading={decisionMutation.isPending}
              loadingText="Sending request"
            >
              Send change request
            </ActionButton>
          </div>
        </form>
      )}
    </section>
  );
}

function getReadableProfileFields(
  detail: OrganizationDetail
): { label: string; value: string }[] {
  return Object.entries(detail.profile).flatMap(([fieldName, fieldValue]) => {
    if (
      typeof fieldValue !== "string" &&
      typeof fieldValue !== "number" &&
      typeof fieldValue !== "boolean"
    ) {
      return [];
    }
    return [{ label: formatLabel(fieldName), value: String(fieldValue) }];
  });
}

function formatLabel(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .toLocaleLowerCase()
    .replace(/^./, (firstCharacter) => firstCharacter.toLocaleUpperCase());
}
