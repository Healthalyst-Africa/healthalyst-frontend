"use client";

import { ActionButton } from "@healthalyst/ui/components/action-button";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@healthalyst/ui/components/field";
import { Input } from "@healthalyst/ui/components/input";
import { Textarea } from "@healthalyst/ui/components/textarea";
import type { OrganizationDetailsProperties } from "~/features/organization-oversight/types/organization-details";
import { useOrganizationApplicationDetails } from "~/features/organization-oversight/hooks/use-organization-application-details";
import {
  getReadableProfileFields,
  formatLabel,
} from "~/features/organization-oversight/utilities/organization-display";
import { DOCUMENT_VIEW_CONFIGURATION } from "~/features/organization-oversight/config/document-view-configuration";
import { REVIEW_VALIDATION_LIMITS } from "~/features/organization-oversight/config/review-configuration";

export function OrganizationApplicationDetails({
  application,
  staffIdentity,
  canReview,
}: OrganizationDetailsProperties) {
  const {
    detailQuery,
    decisionMutation,
    documentViewAddressMutation,
    requestError,
    documentViewAddresses,
    handleRequestChanges,
    handleGetDocumentViewAddress,
    clearRequestError,
  } = useOrganizationApplicationDetails({ application, staffIdentity });

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
                    {Math.ceil(
                      documentRecord.sizeBytes /
                        DOCUMENT_VIEW_CONFIGURATION.bytesPerKilobyte
                    )}{" "}
                    KB
                  </p>
                </div>
                {documentViewAddresses[documentRecord.id] ? (
                  <a
                    href={documentViewAddresses[documentRecord.id].url}
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
                    isLoading={documentViewAddressMutation.isPending}
                    loadingText="Getting link"
                    onClick={() =>
                      void handleGetDocumentViewAddress(documentRecord.id)
                    }
                  >
                    Get secure view link
                  </ActionButton>
                )}
              </li>
            ))}
          </ul>
        )}
        {documentViewAddressMutation.error && (
          <FieldError role="alert">
            {documentViewAddressMutation.error.message}
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
              maxLength={REVIEW_VALIDATION_LIMITS.changeFieldMaximumLength}
              placeholder="For example, facility licence"
              onChange={clearRequestError}
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
              maxLength={REVIEW_VALIDATION_LIMITS.changeMessageMaximumLength}
              placeholder="Explain what information or document is required."
              onChange={clearRequestError}
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
