"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  useClaimOrganizationMutation,
  useOrganizationDetailQuery,
  useOrganizationDocumentViewAddressMutation,
  useReleaseOrganizationMutation,
  useReviewDecisionMutation,
} from "~/features/organization-oversight/hooks/use-organization-oversight";
import {
  approvalDecisionSchema,
  rejectionDecisionSchema,
  requestChangesSchema,
} from "~/features/organization-oversight/schemas/review-schemas";
import { REVIEW_PRODUCT_CODES } from "~/features/organization-oversight/config/review-configuration";
import type { ProductCode } from "~/features/organization-oversight/types/review-types";
import type {
  ReviewChecklistState,
  ReviewApplicationProperties,
} from "~/features/organization-oversight/types/review-controller";

export type ReviewDecisionKind = "approve" | "reject" | "changes";

const DECISION_CONFIRMATIONS: Record<
  ReviewDecisionKind,
  { title: string; description: string }
> = {
  approve: {
    title: "Organisation approved",
    description:
      "The organisation is approved and the products you enabled are now active.",
  },
  reject: {
    title: "Application rejected",
    description:
      "The application is closed and your reason is recorded. Rejected applications cannot be reopened.",
  },
  changes: {
    title: "Changes requested",
    description:
      "The applicant can now update their application and submit it again.",
  },
};

const EMPTY_CHECKLIST: ReviewChecklistState = {
  cacVerified: false,
  facilityLicenceVerified: false,
  directorLicenceVerified: false,
  addressPlausible: false,
  duplicateChecked: false,
};

function isProductCode(code: string): code is ProductCode {
  return REVIEW_PRODUCT_CODES.some((productCode) => productCode === code);
}

export function useReviewApplication({
  application,
  staffIdentity,
}: ReviewApplicationProperties) {
  const detailQuery = useOrganizationDetailQuery(staffIdentity, application.id);
  const claimMutation = useClaimOrganizationMutation(staffIdentity);
  const releaseMutation = useReleaseOrganizationMutation(staffIdentity);
  const decisionMutation = useReviewDecisionMutation(staffIdentity);
  const documentViewMutation = useOrganizationDocumentViewAddressMutation();
  const [openDecision, setOpenDecision] = useState<ReviewDecisionKind | null>(
    null
  );
  const [completedDecision, setCompletedDecision] =
    useState<ReviewDecisionKind | null>(null);
  const [checklist, setChecklist] =
    useState<ReviewChecklistState>(EMPTY_CHECKLIST);
  const [selectedProducts, setSelectedProducts] = useState<ProductCode[]>([]);
  const [decisionError, setDecisionError] = useState("");
  const [openingDocumentIdentifier, setOpeningDocumentIdentifier] = useState<
    string | null
  >(null);

  const canReview =
    application.status === "UNDER_REVIEW" &&
    application.reviewerId === staffIdentity.staffAccountId;
  const isClaimedByAnotherReviewer =
    application.status === "UNDER_REVIEW" && !canReview;
  const canClaim = application.status === "PENDING_VERIFICATION";
  const requestedProductCodes = (detailQuery.data?.products ?? [])
    .map((product) => product.code)
    .filter(isProductCode);
  const requestedProductKey = requestedProductCodes.join(",");

  // Start the approval with the products the organisation asked for.
  useEffect(() => {
    if (!requestedProductKey) return;
    setSelectedProducts(requestedProductKey.split(",").filter(isProductCode));
  }, [requestedProductKey]);

  function openDecisionDialog(decision: ReviewDecisionKind) {
    setDecisionError("");
    decisionMutation.reset();
    setOpenDecision(decision);
  }

  function closeDecisionDialog() {
    if (decisionMutation.isPending) return;
    setOpenDecision(null);
    setDecisionError("");
  }

  function recordDecision(
    decisionKind: ReviewDecisionKind,
    decision: Parameters<typeof decisionMutation.mutate>[0]["decision"]
  ) {
    decisionMutation.mutate(
      { organizationId: application.id, decision },
      {
        onSuccess: () => {
          setOpenDecision(null);
          setCompletedDecision(decisionKind);
        },
      }
    );
  }

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
      return;
    }
    setDecisionError("");
    recordDecision("approve", {
      status: "APPROVED",
      version: detail.version,
      ...result.data,
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
        .querySelector<HTMLElement>(`[name="${invalidFieldName}"]`)
        ?.focus();
      return;
    }
    setDecisionError("");
    recordDecision("reject", {
      status: "REJECTED",
      version: detail.version,
      ...result.data,
    });
  }

  function handleRequestChanges(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const detail = detailQuery.data;
    if (!detail || !canReview) return;
    const formElement = formEvent.currentTarget;
    const formData = new FormData(formElement);
    const result = requestChangesSchema.safeParse({
      field: formData.get("field"),
      message: formData.get("message"),
    });
    if (!result.success) {
      setDecisionError(
        result.error.issues[0]?.message ?? "Describe the changes needed."
      );
      const invalidFieldName =
        result.error.issues[0]?.path[0] === "message" ? "message" : "field";
      formElement
        .querySelector<HTMLElement>(`[name="${invalidFieldName}"]`)
        ?.focus();
      return;
    }
    setDecisionError("");
    recordDecision("changes", {
      status: "CHANGES_REQUESTED",
      version: detail.version,
      items: [result.data],
    });
  }

  /**
   * Opens a document's short-lived secure link in a new tab. The tab opens
   * immediately, so browsers do not block it while the link is fetched.
   */
  async function openDocument(documentId: string) {
    const viewerWindow = window.open("about:blank", "_blank");
    setOpeningDocumentIdentifier(documentId);
    try {
      const documentView = await documentViewMutation.mutateAsync({
        organizationId: application.id,
        documentId,
      });
      if (viewerWindow) {
        viewerWindow.opener = null;
        viewerWindow.location.href = documentView.url;
      } else {
        window.open(documentView.url, "_blank", "noopener,noreferrer");
      }
    } catch {
      viewerWindow?.close();
    } finally {
      setOpeningDocumentIdentifier(null);
    }
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

  return {
    detailQuery,
    claimMutation,
    releaseMutation,
    decisionMutation,
    documentViewMutation,
    openDecision,
    completedDecision,
    completedConfirmation: completedDecision
      ? DECISION_CONFIRMATIONS[completedDecision]
      : null,
    checklist,
    selectedProducts,
    decisionError: decisionError || decisionMutation.error?.message || "",
    openingDocumentIdentifier,
    canReview,
    canClaim,
    isClaimedByAnotherReviewer,
    openDecisionDialog,
    closeDecisionDialog,
    clearCompletedDecision: () => setCompletedDecision(null),
    handleApprove,
    handleReject,
    handleRequestChanges,
    openDocument,
    updateChecklistItem,
    updateSelectedProduct,
  };
}
