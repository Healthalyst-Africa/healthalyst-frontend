"use client";

import { useState, type FormEvent } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { CheckboxField } from "@healthalyst/ui/components/checkbox-field";
import { FeedbackDialog } from "@healthalyst/ui/components/feedback-dialog";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { FormMessage } from "@healthalyst/ui/components/form-message";
import { SummaryTiles } from "@healthalyst/ui/components/review-summary";
import { StepUpDialog } from "@healthalyst/ui/components/step-up-dialog";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { ORGANIZATION_PRODUCT_CHANGE } from "~/features/organization-oversight/config/organization-products";
import { REVIEW_PRODUCTS } from "~/features/organization-oversight/config/review-configuration";
import { REVIEW_PRODUCT_STATUS_PRESENTATION } from "~/features/organization-oversight/config/review-queue";
import { useOrganizationProductsMutation } from "~/features/organization-oversight/hooks/use-organization-oversight";
import { organizationProductsFormSchema } from "~/features/organization-oversight/schemas/review-decision-schemas";
import type {
  OrganizationDetail,
  RegistrationStatus,
} from "~/features/organization-oversight/types/organization-types";
import type {
  OrganizationProductsResult,
  ProductCode,
} from "~/features/organization-oversight/types/review-types";
import { STAFF_AUTHENTICATOR_CONFIGURATION } from "~/features/staff-auth/config/staff-sign-in";
import { useStepUpProtection } from "~/features/staff-auth/hooks/use-step-up-protection";
import type { StaffIdentity } from "~/features/staff-auth/types/staff-identity";

function productLabel(code: string): string {
  return (
    REVIEW_PRODUCTS.find((product) => product.code === code)?.label ?? code
  );
}

function listProducts(codes: readonly string[]): string {
  return new Intl.ListFormat("en-GB", { type: "conjunction" }).format(
    codes.map(productLabel)
  );
}

function describeProductsResult(result: OrganizationProductsResult): string {
  const sentences = [
    result.activated.length > 0 &&
      `${listProducts(result.activated)} ${result.activated.length === 1 ? "is" : "are"} now active.`,
    result.suspended.length > 0 &&
      `${listProducts(result.suspended)} ${result.suspended.length === 1 ? "is" : "are"} paused. Their data is kept, so you can start them again later.`,
    "Members' access was updated at once and the organisation was emailed.",
  ];
  return sentences.filter(Boolean).join(" ");
}

/**
 * The organisation's products. After approval, platform admins can add
 * products or pause them; pausing keeps the product's data.
 */
export function OrganizationProductsSection({
  organizationId,
  status,
  detail,
  staffIdentity,
}: {
  organizationId: string;
  status: RegistrationStatus;
  detail: OrganizationDetail;
  staffIdentity: StaffIdentity;
}) {
  const productsMutation = useOrganizationProductsMutation(staffIdentity);
  const stepUpProtection = useStepUpProtection();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<ProductCode[]>([]);
  const [fieldErrors, setFieldErrors] = useState<{
    products?: string;
    reason?: string;
  }>({});
  const [result, setResult] = useState<OrganizationProductsResult | null>(null);

  const isApproved = ORGANIZATION_PRODUCT_CHANGE.fromStatuses.includes(status);
  const canChangeProducts =
    isApproved &&
    ORGANIZATION_PRODUCT_CHANGE.roles.some((role) =>
      staffIdentity.platformRoles.includes(role)
    );

  function openDialog() {
    productsMutation.reset();
    setFieldErrors({});
    setSelectedProducts(
      REVIEW_PRODUCTS.map((product) => product.code).filter((code) =>
        detail.products.some(
          (product) => product.code === code && product.status === "ACTIVE"
        )
      )
    );
    setIsDialogOpen(true);
  }

  function closeDialog() {
    if (productsMutation.isPending || stepUpProtection.isAwaitingCode) return;
    setIsDialogOpen(false);
  }

  function toggleProduct(code: ProductCode, isChecked: boolean) {
    setSelectedProducts((currentProducts) =>
      isChecked
        ? [...currentProducts, code]
        : currentProducts.filter((currentCode) => currentCode !== code)
    );
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      products: undefined,
    }));
  }

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formElement = formEvent.currentTarget;
    const validation = organizationProductsFormSchema.safeParse({
      products: selectedProducts,
      reason: new FormData(formElement).get("reason"),
    });
    if (!validation.success) {
      const errors: { products?: string; reason?: string } = {};
      for (const issue of validation.error.issues) {
        const fieldName = issue.path[0];
        if (fieldName === "products" || fieldName === "reason") {
          errors[fieldName] ??= issue.message;
        }
      }
      setFieldErrors(errors);
      formElement
        .querySelector<HTMLElement>(
          errors.products
            ? "#organization-products-fieldset"
            : '[name="reason"]'
        )
        ?.focus();
      return;
    }
    setFieldErrors({});
    const change = validation.data;
    await stepUpProtection.runProtected({
      description: "change this organisation's products",
      run: async () => {
        const productsResult = await productsMutation.mutateAsync({
          organizationId,
          change,
        });
        setIsDialogOpen(false);
        setResult(productsResult);
      },
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-medium">
          {isApproved ? "Products" : "Products requested"}
        </h3>
        {canChangeProducts && (
          <ActionButton
            type="button"
            variant="outline"
            size="small"
            onClick={openDialog}
          >
            Change products
          </ActionButton>
        )}
      </div>
      {detail.products.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No products were requested.
        </p>
      ) : (
        <SummaryTiles
          tiles={detail.products.map((product) => {
            const reviewProduct = REVIEW_PRODUCTS.find(
              (candidate) => candidate.code === product.code
            );
            return {
              key: product.code,
              title: reviewProduct?.label ?? product.code,
              description: reviewProduct?.description,
              // Before approval every listed product was requested; show other states only.
              status:
                product.status === "PENDING"
                  ? undefined
                  : (REVIEW_PRODUCT_STATUS_PRESENTATION[product.status] ?? {
                      label: product.status,
                      tone: "neutral" as const,
                    }),
            };
          })}
        />
      )}

      {canChangeProducts && (
        <FormDialog
          open={isDialogOpen}
          onOpenChange={(isOpen) => !isOpen && closeDialog()}
          title="Change products"
          description="Ticked products are active. Unticking one pauses it and keeps its data; tick it again later to start it. Members' access changes at once and the organisation is emailed."
          submitLabel="Save products"
          submittingLabel="Saving products"
          isSubmitting={productsMutation.isPending}
          error={
            productsMutation.error && !stepUpProtection.isAwaitingCode
              ? productsMutation.error.message
              : ""
          }
          onSubmit={(formEvent) => void handleSubmit(formEvent)}
        >
          <fieldset
            id="organization-products-fieldset"
            tabIndex={-1}
            className="flex flex-col gap-3 outline-none"
            aria-invalid={Boolean(fieldErrors.products) || undefined}
            aria-describedby={
              fieldErrors.products
                ? "organization-products-fieldset-error"
                : undefined
            }
          >
            <legend className="mb-3 text-sm font-medium">
              Products this organisation uses
            </legend>
            {REVIEW_PRODUCTS.map((product) => (
              <CheckboxField
                key={product.code}
                id={`organization-product-${product.code}`}
                name="productCode"
                value={product.code}
                label={product.label}
                description={product.description}
                checked={selectedProducts.includes(product.code)}
                onCheckedChange={(isChecked) =>
                  toggleProduct(product.code, isChecked)
                }
              />
            ))}
            {fieldErrors.products && (
              <div id="organization-products-fieldset-error">
                <FormMessage tone="error">{fieldErrors.products}</FormMessage>
              </div>
            )}
          </fieldset>
          <TextAreaField
            id="organization-products-reason"
            label="Reason"
            description="Recorded in the organisation's history."
            name="reason"
            required
            rows={3}
            minLength={ORGANIZATION_PRODUCT_CHANGE.reasonMinimumLength}
            maxLength={ORGANIZATION_PRODUCT_CHANGE.reasonMaximumLength}
            error={fieldErrors.reason}
          />
        </FormDialog>
      )}

      <StepUpDialog
        {...stepUpProtection.dialog}
        completingLabel="Saving products"
        authenticatorCodeLength={STAFF_AUTHENTICATOR_CONFIGURATION.codeLength}
        recoveryCodeMaximumLength={
          STAFF_AUTHENTICATOR_CONFIGURATION.recoveryCodeMaximumLength
        }
      />

      {result && (
        <FeedbackDialog
          open
          onOpenChange={(isOpen) => !isOpen && setResult(null)}
          tone="success"
          title="Products saved"
          description={describeProductsResult(result)}
          primaryAction={{ label: "Done", onSelect: () => setResult(null) }}
        />
      )}
    </section>
  );
}
