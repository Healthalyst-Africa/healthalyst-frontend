import { z } from "zod";
import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import { getPlatformHttpClient } from "~/features/staff-auth/api/platform-http-client";

const organizationStatusSchema = z.enum([
  "DRAFT",
  "PENDING_VERIFICATION",
  "UNDER_REVIEW",
  "CHANGES_REQUESTED",
  "ACTIVE",
  "SUSPENDED",
  "REJECTED",
  "DEACTIVATED",
]);

const organizationTypeSchema = z.enum([
  "CLINIC",
  "HOSPITAL",
  "SPECIALIST_CLINIC",
  "DIAGNOSTIC_CENTRE",
  "LABORATORY",
  "IMAGING_CENTRE",
  "PHARMACY",
  "MULTI_BRANCH_GROUP",
]);

const organizationApplicationSchema = z.object({
  id: z.uuid(),
  legalName: z.string(),
  displayName: z.string(),
  type: organizationTypeSchema.nullable(),
  stateCode: z.string().nullable(),
  status: organizationStatusSchema,
  submittedAt: z.iso.datetime().nullable(),
  reviewerId: z.uuid().nullable(),
  createdAt: z.iso.datetime(),
});

const organizationListResponseSchema = z.object({
  data: z.array(organizationApplicationSchema),
  page: z.object({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});

const organizationDocumentSchema = z.object({
  id: z.uuid(),
  type: z.enum([
    "CAC_CERTIFICATE",
    "FACILITY_LICENCE",
    "MEDICAL_DIRECTOR_LICENCE",
    "MLSCN_LICENCE",
    "PCN_PREMISES_LICENCE",
    "NHIA_ACCREDITATION",
    "PROOF_OF_ADDRESS",
    "OTHER",
  ]),
  fileName: z.string(),
  contentType: z.string(),
  sizeBytes: z.number().int(),
  status: z.enum([
    "UPLOADING",
    "SCANNING",
    "CLEAN",
    "INFECTED",
    "ACCEPTED",
    "REJECTED",
  ]),
  expiresOn: z.iso.date().nullable(),
  createdAt: z.iso.datetime(),
});

const organizationDetailSchema = organizationApplicationSchema.extend({
  version: z.number().int().positive(),
  profile: z.record(z.string(), z.unknown()),
  products: z.array(z.object({ code: z.string(), status: z.string() })),
  documents: z.array(organizationDocumentSchema),
  members: z.array(z.unknown()),
  history: z.array(z.unknown()),
  possibleDuplicates: z.array(
    z.object({
      id: z.uuid(),
      legalName: z.string(),
      status: organizationStatusSchema,
      matchedOn: z.array(z.string()),
    })
  ),
});

const organizationStatusChangeSchema = z.object({
  id: z.uuid(),
  status: organizationStatusSchema,
  version: z.number().int(),
});

const documentViewUrlSchema = z.object({
  url: z.url(),
  expiresIn: z.number().int().positive(),
});

const reviewChecklistSchema = z.object({
  cacVerified: z.literal(true),
  facilityLicenceVerified: z.literal(true),
  directorLicenceVerified: z.literal(true),
  addressPlausible: z.literal(true),
  duplicateChecked: z.literal(true),
});

const productCodeSchema = z.enum([
  "HEALTHSCHEDULE",
  "LABCONNECT",
  "PHARMADESK",
]);

const approvalBodySchema = z.object({
  checklist: reviewChecklistSchema,
  products: z.array(productCodeSchema).min(1),
  note: z.string().max(2000).optional(),
});

export type OrganizationApplication = z.infer<
  typeof organizationApplicationSchema
>;
export type OrganizationDetail = z.infer<typeof organizationDetailSchema>;
export type RegistrationStatus = z.infer<typeof organizationStatusSchema>;
export type OrganizationDocument = z.infer<typeof organizationDocumentSchema>;
export type ReviewChecklist = z.infer<typeof reviewChecklistSchema>;
export type ProductCode = z.infer<typeof productCodeSchema>;

export type ReviewDecision =
  | {
      status: "CHANGES_REQUESTED";
      version: number;
      items: { field: string; message: string }[];
      message?: string;
    }
  | {
      status: "APPROVED";
      version: number;
      checklist: ReviewChecklist;
      products: ProductCode[];
      note?: string;
    }
  | {
      status: "REJECTED";
      version: number;
      reasonCode:
        | "INCOMPLETE_INFORMATION"
        | "INVALID_DOCUMENTS"
        | "UNVERIFIABLE_LICENCE"
        | "DUPLICATE_ORGANIZATION"
        | "OUT_OF_SERVICE_AREA"
        | "NOT_A_HEALTH_FACILITY"
        | "FRAUD_SUSPECTED"
        | "OTHER";
      message: string;
    };

const organizationsEndpoint = "/v1/admin/organizations";

export async function listOrganizationApplications(
  searchTerm = ""
): Promise<OrganizationApplication[]> {
  const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase();
  if (normalizedSearchTerm.length >= 2) {
    return listOrganizationsByStatus(undefined, normalizedSearchTerm);
  }
  const organizationApplications = await listOrganizationsByStatus();
  return normalizedSearchTerm
    ? organizationApplications.filter(
        (organization) =>
          organization.legalName
            .toLocaleLowerCase()
            .includes(normalizedSearchTerm) ||
          organization.displayName
            .toLocaleLowerCase()
            .includes(normalizedSearchTerm)
      )
    : organizationApplications;
}

export async function listReviewQueue(): Promise<OrganizationApplication[]> {
  const [pendingApplications, claimedApplications] = await Promise.all([
    listOrganizationsByStatus("PENDING_VERIFICATION"),
    listOrganizationsByStatus("UNDER_REVIEW"),
  ]);
  return [...pendingApplications, ...claimedApplications];
}

export async function getOrganizationDetail(
  organizationId: string
): Promise<OrganizationDetail> {
  return runPlatformRequest(
    "We could not load this organisation's application. Try again.",
    async () => {
      const response = await getPlatformHttpClient().get<unknown>(
        `${organizationsEndpoint}/${encodeURIComponent(organizationId)}`
      );
      return organizationDetailSchema.parse(response.data);
    }
  );
}

export async function claimOrganizationApplication(
  organizationId: string
): Promise<void> {
  await postOrganizationAction(
    organizationId,
    "claim",
    undefined,
    "We could not claim this application. Refresh and try again."
  );
}

export async function releaseOrganizationApplication(
  organizationId: string
): Promise<void> {
  await postOrganizationAction(
    organizationId,
    "release",
    undefined,
    "We could not release this application. Refresh and try again."
  );
}

export async function recordReviewDecision(
  organizationId: string,
  decision: ReviewDecision
): Promise<void> {
  const action =
    decision.status === "CHANGES_REQUESTED"
      ? "request-changes"
      : decision.status === "APPROVED"
        ? "approve"
        : "reject";
  let requestBody: unknown;
  if (decision.status === "CHANGES_REQUESTED") {
    requestBody = {
      items: decision.items,
      ...(decision.message ? { message: decision.message } : {}),
    };
  } else if (decision.status === "APPROVED") {
    const approvalBody = approvalBodySchema.safeParse({
      checklist: decision.checklist,
      products: decision.products,
      ...(decision.note ? { note: decision.note } : {}),
    });
    if (!approvalBody.success) {
      throw new Error("Check the approval checklist and selected products.");
    }
    requestBody = approvalBody.data;
  } else {
    requestBody = {
      reasonCode: decision.reasonCode,
      message: decision.message,
    };
  }
  await postOrganizationAction(
    organizationId,
    action,
    requestBody,
    "We could not save the review decision. Refresh and try again.",
    decision.version
  );
}

export async function getOrganizationDocumentViewUrl(
  organizationId: string,
  documentId: string
): Promise<{ url: string; expiresIn: number }> {
  return runPlatformRequest(
    "We could not open this document. Try again.",
    async () => {
      const response = await getPlatformHttpClient().get<unknown>(
        `${organizationsEndpoint}/${encodeURIComponent(organizationId)}/documents/${encodeURIComponent(documentId)}/url`
      );
      return documentViewUrlSchema.parse(response.data);
    }
  );
}

export async function addOrganizationInternalNote(
  organizationId: string,
  note: string
): Promise<void> {
  await postOrganizationAction(
    organizationId,
    "notes",
    { note },
    "We could not save the internal note. Try again."
  );
}

export async function suspendOrganization(
  organizationId: string,
  reason: string
): Promise<void> {
  await postOrganizationAction(
    organizationId,
    "suspend",
    { reason },
    "We could not suspend this organisation. Try again."
  );
}

export async function reinstateOrganization(
  organizationId: string,
  reason: string
): Promise<void> {
  await postOrganizationAction(
    organizationId,
    "reinstate",
    { reason },
    "We could not reinstate this organisation. Try again."
  );
}

export async function deactivateOrganization(
  organizationId: string,
  reason: string
): Promise<void> {
  await postOrganizationAction(
    organizationId,
    "deactivate",
    { reason },
    "We could not deactivate this organisation. Try again."
  );
}

async function postOrganizationAction(
  organizationId: string,
  action: string,
  requestBody: unknown,
  fallbackMessage: string,
  version?: number
): Promise<void> {
  await runPlatformRequest(fallbackMessage, async () => {
    const response = await getPlatformHttpClient().post<unknown>(
      `${organizationsEndpoint}/${encodeURIComponent(organizationId)}/${action}`,
      requestBody,
      {
        headers: {
          ...(version === undefined ? {} : { "If-Match": `"${version}"` }),
        },
      }
    );
    if (response.status !== 204) {
      organizationStatusChangeSchema.parse(response.data);
    }
  });
}

async function runPlatformRequest<ResponseType>(
  fallbackMessage: string,
  request: () => Promise<ResponseType>
): Promise<ResponseType> {
  try {
    return await request();
  } catch (error) {
    throw toPlatformApiError(error, fallbackMessage);
  }
}

async function listOrganizationsByStatus(
  status?: RegistrationStatus,
  searchTerm?: string
): Promise<OrganizationApplication[]> {
  return runPlatformRequest(
    status === "PENDING_VERIFICATION" || status === "UNDER_REVIEW"
      ? "We could not load the review queue. Try again."
      : "We could not load organisations. Try again.",
    async () => {
      const organizationApplications: OrganizationApplication[] = [];
      const seenCursors = new Set<string>();
      let cursor: string | undefined;
      let hasMore = true;
      while (hasMore) {
        const response = await getPlatformHttpClient().get<unknown>(
          organizationsEndpoint,
          {
            params: {
              limit: 100,
              ...(status ? { status } : {}),
              ...(searchTerm ? { q: searchTerm } : {}),
              ...(cursor ? { cursor } : {}),
            },
          }
        );
        const page = organizationListResponseSchema.parse(response.data);
        organizationApplications.push(...page.data);
        hasMore = page.page.hasMore;
        if (!hasMore || !page.page.nextCursor) break;
        if (seenCursors.has(page.page.nextCursor)) {
          throw new Error("The organisation list returned a repeated cursor.");
        }
        seenCursors.add(page.page.nextCursor);
        cursor = page.page.nextCursor;
      }
      return organizationApplications;
    }
  );
}
