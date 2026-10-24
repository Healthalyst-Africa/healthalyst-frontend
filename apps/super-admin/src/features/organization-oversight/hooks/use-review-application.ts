"use client";

import { useState, type FormEvent } from "react";
import {
  useClaimOrganizationMutation,
  useOrganizationDetailQuery,
  useReleaseOrganizationMutation,
  useReviewDecisionMutation,
} from "~/features/organization-oversight/hooks/use-organization-oversight";
import {
  approvalDecisionSchema,
  rejectionDecisionSchema,
} from "~/features/organization-oversight/schemas/review-schemas";
import type { ProductCode } from "~/features/organization-oversight/types/review-types";
import type {
  ReviewChecklistState,
  ReviewApplicationProperties,
} from "~/features/organization-oversight/types/review-controller";

export function useReviewApplication({
  application,
  staffIdentity,
}: ReviewApplicationProperties) {
  const detailQuery = useOrganizationDetailQuery(staffIdentity, application.id);
  const claimMutation = useClaimOrganizationMutation(staffIdentity);
  const releaseMutation = useReleaseOrganizationMutation(staffIdentity);
  const decisionMutation = useReviewDecisionMutation(staffIdentity);
  const [checklist, setChecklist] = useState<ReviewChecklistState>({
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

  function updateChecklistItem(
    checklistName: keyof ReviewChecklistState,
    isChecked: boolean
  ) {
    setDecisionError("");
    setChecklist((currentChecklist) => ({
      ...currentChecklist,
      [checklistName]: isChecked,
    }));
  }

  function updateSelectedProduct(
    productCode: ProductCode,
    isSelected: boolean
  ) {
    setDecisionError("");
    setSelectedProducts((currentProducts) =>
      isSelected
        ? [...currentProducts, productCode]
        : currentProducts.filter(
            (currentProductCode) => currentProductCode !== productCode
          )
    );
  }

  function clearDecisionError() {
    setDecisionError("");
  }

  return {
    detailQuery,
    claimMutation,
    releaseMutation,
    decisionMutation,
    checklist,
    selectedProducts,
    decisionError,
    canReview,
    isClaimedByAnotherReviewer,
    handleApprove,
    handleReject,
    updateChecklistItem,
    updateSelectedProduct,
    clearDecisionError,
  };
}
