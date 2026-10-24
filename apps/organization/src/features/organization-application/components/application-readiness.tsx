import {
  CHECKLIST_ITEMS,
  DOCUMENT_LABELS,
  DOCUMENT_STATUS_LABELS,
} from "~/features/organization-application/config/application-presentation";
import { Badge } from "@healthalyst/ui/components/badge";
import type { OrganizationApplication } from "~/features/organization-application/types/organization-application";

export function ApplicationReadiness({
  application,
}: {
  application: OrganizationApplication;
}) {
  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="application-checklist-heading">
        <h3
          id="application-checklist-heading"
          className="text-base font-semibold"
        >
          Application checklist
        </h3>
        <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
          {CHECKLIST_ITEMS.map((checklistItem) => {
            const isComplete = application.checklist[checklistItem.key];
            return (
              <li
                key={checklistItem.key}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <span className="text-sm">{checklistItem.label}</span>
                <Badge variant={isComplete ? "secondary" : "outline"}>
                  {isComplete ? "Complete" : "To do"}
                </Badge>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="required-documents-heading">
        <h3 id="required-documents-heading" className="text-base font-semibold">
          Required documents
        </h3>
        {application.requiredDocuments.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No document requirements are available for this organisation yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
            {application.requiredDocuments.map((requiredDocument) => (
              <li
                key={requiredDocument.type}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <span className="text-sm">
                  {DOCUMENT_LABELS[requiredDocument.type] ??
                    requiredDocument.type}
                  <span className="ml-1 text-muted-foreground">
                    {requiredDocument.required ? "(required)" : "(optional)"}
                  </span>
                </span>
                <Badge
                  variant={requiredDocument.satisfied ? "secondary" : "outline"}
                >
                  {requiredDocument.satisfied ? "Received" : "Outstanding"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        {application.documents.length > 0 && (
          <ul
            className="mt-3 flex flex-col gap-2"
            aria-label="Uploaded documents"
          >
            {application.documents.map((document) => (
              <li
                key={document.id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground"
              >
                <span className="break-all">{document.fileName}</span>
                <span>
                  {DOCUMENT_STATUS_LABELS[document.status] ?? document.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {application.messages.length > 0 && (
        <section aria-labelledby="review-messages-heading">
          <h3 id="review-messages-heading" className="text-base font-semibold">
            Updates from the review team
          </h3>
          <ul className="mt-3 flex flex-col gap-3">
            {application.messages.map((reviewMessage) => (
              <li
                key={`${reviewMessage.createdAt}-${reviewMessage.toStatus}`}
                className="rounded-lg border border-border p-4"
              >
                <p className="text-sm font-medium">
                  {reviewMessage.message ??
                    "Your application status was updated."}
                </p>
                {reviewMessage.items && reviewMessage.items.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-2">
                    {reviewMessage.items.map((messageItem) => (
                      <li key={`${messageItem.field}-${messageItem.message}`}>
                        <p className="text-sm text-muted-foreground">
                          {messageItem.message}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                <time
                  className="mt-2 block text-xs text-muted-foreground"
                  dateTime={reviewMessage.createdAt}
                >
                  {new Date(reviewMessage.createdAt).toLocaleDateString(
                    "en-NG",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      timeZone: "UTC",
                    }
                  )}
                </time>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
