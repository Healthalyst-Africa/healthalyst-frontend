"use client";

import { useState, type FormEvent } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@healthalyst/ui/components/card";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@healthalyst/ui/components/field";
import { Textarea } from "@healthalyst/ui/components/textarea";
import type { StaffIdentity } from "~/features/staff-auth/api/staff-service";
import type {
  OrganizationApplication,
  ProductCode,
  ReviewChecklist,
} from "~/features/organization-oversight/api/organization-service";
import { OrganizationApplicationDetails } from "~/features/organization-oversight/components/organization-application-details";
import {
  useClaimOrganizationMutation,
  useOrganizationDetailQuery,
  useReleaseOrganizationMutation,
  useReviewDecisionMutation,
} from "~/features/organization-oversight/hooks/use-organization-oversight";
import {
  approvalDecisionSchema,
  rejectionDecisionSchema,
} from "~/features/organization-oversight/model/review-schemas";

const reviewChecklistItems: {
  name: keyof ReviewChecklist;
  label: string;
}[] = [
  { name: "cacVerified", label: "CAC certificate checked" },
  { name: "facilityLicenceVerified", label: "Facility licence checked" },
  { name: "directorLicenceVerified", label: "Director licence checked" },
  { name: "addressPlausible", label: "Organisation address is plausible" },
  { name: "duplicateChecked", label: "Possible duplicates checked" },
];

const availableProducts: { code: ProductCode; label: string }[] = [
  { code: "HEALTHSCHEDULE", label: "HealthSchedule" },
  { code: "LABCONNECT", label: "LabConnect" },
  { code: "PHARMADESK", label: "PharmaDesk" },
];

export function ReviewApplicationCard({
  application,
  staffIdentity,
}: {
  application: OrganizationApplication;
  staffIdentity: StaffIdentity;
}) {
  const detailQuery = useOrganizationDetailQuery(staffIdentity, application.id);
  const claimMutation = useClaimOrganizationMutation(staffIdentity);
  const releaseMutation = useReleaseOrganizationMutation(staffIdentity);
  const decisionMutation = useReviewDecisionMutation(staffIdentity);
  const [checklist, setChecklist] = useState<
    Record<keyof ReviewChecklist, boolean>
  >({
    cacVerified: false,
    facilityLicenceVerified: false,
    directorLicenceVerified: false,
    addressPlausible: false,
    duplicateChecked: false,
  });
  const [selectedProducts, setSelectedProducts] = useState<ProductCode[]>([]);
  const [decisionError, setDecisionError] = useState("");

  const canReview =
    application.status === "UNDER_REVIEW" &&
    application.reviewerId === staffIdentity.staffAccountId;
  const isClaimedByAnotherReviewer =
    application.status === "UNDER_REVIEW" && !canReview;

  function handleApprove(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const detail = detailQuery.data;
    if (!detail || !canReview) return;
    const formData = new FormData(formEvent.currentTarget);
    const result = approvalDecisionSchema.safeParse({
      checklist,
      products: selectedProducts,
      note: formData.get("approvalNote"),
    });
    if (!result.success) {
      setDecisionError(
        result.error.issues[0]?.message ?? "Complete the approval checklist."
      );
      const invalidChecklistItem = result.error.issues.find(
        (issue) => issue.path[0] === "checklist"
      );
      if (invalidChecklistItem?.path[1]) {
        formEvent.currentTarget
          .querySelector<HTMLInputElement>(
            `[name="${String(invalidChecklistItem.path[1])}"]`
          )
          ?.focus();
      } else if (result.error.issues[0]?.path[0] === "products") {
        formEvent.currentTarget
          .querySelector<HTMLInputElement>("[name=productCode]")
          ?.focus();
      }
      return;
    }
    setDecisionError("");
    decisionMutation.mutate({
      organizationId: application.id,
      decision: {
        status: "APPROVED",
        version: detail.version,
        ...result.data,
      },
    });
  }

  function handleReject(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const detail = detailQuery.data;
    if (!detail || !canReview) return;
    const formElement = formEvent.currentTarget;
    const formData = new FormData(formElement);
    const result = rejectionDecisionSchema.safeParse({
      reasonCode: formData.get("reasonCode"),
      message: formData.get("rejectionMessage"),
    });
    if (!result.success) {
      setDecisionError(
        result.error.issues[0]?.message ?? "Add a reason for rejection."
      );
      const invalidFieldName =
        result.error.issues[0]?.path[0] === "reasonCode"
          ? "reasonCode"
          : "rejectionMessage";
      formElement
        .querySelector<HTMLSelectElement | HTMLTextAreaElement>(
          `[name="${invalidFieldName}"]`
        )
        ?.focus();
      return;
    }
    setDecisionError("");
    decisionMutation.mutate({
      organizationId: application.id,
      decision: {
        status: "REJECTED",
        version: detail.version,
        ...result.data,
      },
    });
  }

  const submittedAtLabel = application.submittedAt
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(application.submittedAt))
    : "Not submitted";

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle className="text-lg">
            {application.displayName || application.legalName}
          </CardTitle>
          <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-semibold">
            {application.status.replaceAll("_", " ")}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Submitted {submittedAtLabel}
          {application.type
            ? ` · ${application.type.replaceAll("_", " ")}`
            : ""}
          {application.stateCode ? ` · ${application.stateCode}` : ""}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {application.status === "PENDING_VERIFICATION" && (
          <div className="flex flex-wrap items-center gap-3">
            <ActionButton
              type="button"
              isLoading={claimMutation.isPending}
              loadingText="Claiming application"
              onClick={() => claimMutation.mutate(application.id)}
            >
              Claim for review
            </ActionButton>
            {claimMutation.error && (
              <FieldError role="alert">
                {claimMutation.error.message}
              </FieldError>
            )}
          </div>
        )}
        {isClaimedByAnotherReviewer && (
          <p className="text-sm text-muted-foreground">
            This application is assigned to another reviewer.
          </p>
        )}
        {canReview && (
          <ActionButton
            type="button"
            variant="outline"
            className="self-start"
            isLoading={releaseMutation.isPending}
            loadingText="Releasing application"
            onClick={() => releaseMutation.mutate(application.id)}
          >
            Return to review queue
          </ActionButton>
        )}
        {releaseMutation.error && (
          <FieldError role="alert">{releaseMutation.error.message}</FieldError>
        )}

        <OrganizationApplicationDetails
          application={application}
          staffIdentity={staffIdentity}
          canReview={canReview}
        />

        {canReview && detailQuery.data && (
          <div className="grid gap-4 border-t border-border pt-5 lg:grid-cols-2">
            <form
              className="flex flex-col gap-4"
              onSubmit={handleApprove}
              noValidate
            >
              <div>
                <h3 className="font-semibold">Approve organisation</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Complete every verification check and choose the products to
                  enable.
                </p>
              </div>
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-2 text-sm font-medium">
                  Verification checklist
                </legend>
                {reviewChecklistItems.map((checklistItem) => (
                  <label
                    key={checklistItem.name}
                    className="flex items-start gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      name={checklistItem.name}
                      checked={checklist[checklistItem.name]}
                      onChange={(changeEvent) => {
                        setDecisionError("");
                        setChecklist((currentChecklist) => ({
                          ...currentChecklist,
                          [checklistItem.name]: changeEvent.target.checked,
                        }));
                      }}
                      className="mt-0.5 size-4 accent-primary"
                    />
                    <span>{checklistItem.label}</span>
                  </label>
                ))}
              </fieldset>
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-2 text-sm font-medium">
                  Products to enable
                </legend>
                {availableProducts.map((product) => (
                  <label
                    key={product.code}
                    className="flex items-start gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="productCode"
                      value={product.code}
                      checked={selectedProducts.includes(product.code)}
                      onChange={(changeEvent) => {
                        setDecisionError("");
                        setSelectedProducts((currentProducts) =>
                          changeEvent.target.checked
                            ? [...currentProducts, product.code]
                            : currentProducts.filter(
                                (productCode) => productCode !== product.code
                              )
                        );
                      }}
                      className="mt-0.5 size-4 accent-primary"
                    />
                    <span>{product.label}</span>
                  </label>
                ))}
              </fieldset>
              <Field className="gap-1.5">
                <FieldLabel htmlFor={`approval-note-${application.id}`}>
                  Internal approval note (optional)
                </FieldLabel>
                <Textarea
                  id={`approval-note-${application.id}`}
                  name="approvalNote"
                  rows={3}
                  maxLength={2000}
                  onChange={() => setDecisionError("")}
                />
              </Field>
              <ActionButton
                type="submit"
                isLoading={decisionMutation.isPending}
                loadingText="Approving organisation"
              >
                Approve organisation
              </ActionButton>
            </form>

            <form
              className="flex flex-col gap-4"
              onSubmit={handleReject}
              noValidate
            >
              <div>
                <h3 className="font-semibold">Reject application</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Rejection is terminal. Give the applicant a clear reason.
                </p>
              </div>
              <Field className="gap-1.5">
                <FieldLabel htmlFor={`rejection-reason-${application.id}`}>
                  Reason
                </FieldLabel>
                <select
                  id={`rejection-reason-${application.id}`}
                  name="reasonCode"
                  defaultValue=""
                  className="min-h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="" disabled>
                    Choose a reason
                  </option>
                  <option value="INCOMPLETE_INFORMATION">
                    Incomplete information
                  </option>
                  <option value="INVALID_DOCUMENTS">Invalid documents</option>
                  <option value="UNVERIFIABLE_LICENCE">
                    Licence cannot be verified
                  </option>
                  <option value="DUPLICATE_ORGANIZATION">
                    Duplicate organisation
                  </option>
                  <option value="OUT_OF_SERVICE_AREA">
                    Outside service area
                  </option>
                  <option value="NOT_A_HEALTH_FACILITY">
                    Not a health facility
                  </option>
                  <option value="FRAUD_SUSPECTED">Suspected fraud</option>
                  <option value="OTHER">Other</option>
                </select>
              </Field>
              <Field className="gap-1.5">
                <FieldLabel htmlFor={`rejection-message-${application.id}`}>
                  Explanation for applicant
                </FieldLabel>
                <Textarea
                  id={`rejection-message-${application.id}`}
                  name="rejectionMessage"
                  rows={5}
                  minLength={10}
                  maxLength={2000}
                  onChange={() => setDecisionError("")}
                />
              </Field>
              <ActionButton
                type="submit"
                variant="outline"
                disabled={decisionMutation.isPending}
              >
                Reject application
              </ActionButton>
            </form>
          </div>
        )}
        {decisionError && <FieldError role="alert">{decisionError}</FieldError>}
        {decisionMutation.error && (
          <FieldError role="alert">{decisionMutation.error.message}</FieldError>
        )}
        {decisionMutation.isSuccess && (
          <p role="status" className="text-sm text-primary">
            Review decision saved.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
