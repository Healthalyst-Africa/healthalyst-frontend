import { z } from "zod";

const orderKindSchema = z.enum(["LAB", "IMAGING"]);
const specimenSchema = z.enum([
  "BLOOD",
  "URINE",
  "STOOL",
  "SPUTUM",
  "SWAB",
  "CSF",
  "OTHER",
]);
const orderPrioritySchema = z.enum(["STAT", "URGENT", "ROUTINE"]);
const orderStatusSchema = z.enum([
  "ORDERED",
  "COLLECTED",
  "IN_PROGRESS",
  "RESULTED",
  "RELEASED",
  "CANCELLED",
]);
const resultFlagSchema = z.enum([
  "LOW",
  "HIGH",
  "CRITICAL_LOW",
  "CRITICAL_HIGH",
  "ABNORMAL",
]);

/** What the department fills in for a test: a number, a choice or text. */
const resultFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(["NUMBER", "TEXT", "OPTION"]),
  unit: z.string().optional(),
  options: z.array(z.string()).optional(),
  abnormalOptions: z.array(z.string()).optional(),
  refLow: z.number().optional(),
  refHigh: z.number().optional(),
  criticalLow: z.number().optional(),
  criticalHigh: z.number().optional(),
});

/** A test or scan the facility offers. */
export const orderableServiceSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  kind: orderKindSchema,
  departmentId: z.string().nullable(),
  specimen: specimenSchema.nullable(),
  fields: z.array(resultFieldSchema),
  turnaroundHours: z.number().int().nullable(),
  isActive: z.boolean(),
  version: z.number().int(),
});

export const orderCatalogueSchema = z.object({
  data: z.array(orderableServiceSchema),
});

const resultValueSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.string().nullable(),
  unit: z.string().nullable(),
  flag: resultFlagSchema.nullable(),
  /** The reference range shown with the value, such as "12–16". */
  range: z.string().nullable(),
});

/** One test or scan ordered for a patient, with its result once entered. */
export const orderSchema = z.object({
  id: z.string(),
  /** Orders sent together share a group. */
  groupId: z.string(),
  patientId: z.string(),
  visitId: z.string().nullable(),
  serviceId: z.string(),
  serviceCode: z.string(),
  serviceName: z.string(),
  kind: orderKindSchema,
  departmentId: z.string().nullable(),
  specimen: specimenSchema.nullable(),
  priority: orderPrioritySchema,
  /** The clinical question for the lab or radiologist. */
  indication: z.string().nullable(),
  status: orderStatusSchema,
  orderedById: z.string(),
  orderedAt: z.string(),
  collectedAt: z.string().nullable(),
  startedAt: z.string().nullable(),
  /** Why the last sample was rejected; the order went back to ORDERED. */
  rejectedReason: z.string().nullable(),
  cancelReason: z.string().nullable(),
  result: z
    .object({
      values: z.array(resultValueSchema),
      comment: z.string().nullable(),
      enteredById: z.string(),
      enteredAt: z.string(),
      releasedById: z.string().nullable(),
      releasedAt: z.string().nullable(),
      /** Changed after release; earlier versions are kept. */
      amended: z.boolean(),
    })
    .nullable(),
  /** A value beyond a critical limit. */
  critical: z.boolean(),
  payment: z.object({
    status: z.enum(["NO_CHARGE", "COVERED", "PAID", "AWAITING_PAYMENT"]),
    patientKobo: z.number().int(),
    accountId: z.string().nullable(),
  }),
  acknowledgedById: z.string().nullable(),
  acknowledgedAt: z.string().nullable(),
  version: z.number().int(),
});

export const orderListSchema = z.object({ data: z.array(orderSchema) });

/** An inbox row: the order and who it is for. */
export const resultsInboxSchema = z.object({
  data: z.array(
    orderSchema.extend({
      patient: z.object({
        id: z.string(),
        patientNumber: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        sex: z.enum(["male", "female", "other", "unknown"]),
        dateOfBirth: z.string().nullable(),
      }),
    })
  ),
});

/** Earlier versions of an amended result. */
export const resultRevisionsSchema = z.object({
  data: z.array(
    z.object({
      version: z.number().int(),
      values: z.array(resultValueSchema),
      comment: z.string().nullable(),
      reason: z.string().nullable(),
      savedById: z.string(),
      savedAt: z.string(),
    })
  ),
});

export type OrderableService = z.infer<typeof orderableServiceSchema>;
export type Order = z.infer<typeof orderSchema>;
export type OrderKind = z.infer<typeof orderKindSchema>;
export type OrderPriority = z.infer<typeof orderPrioritySchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type ResultValue = z.infer<typeof resultValueSchema>;
export type ResultsInboxItem = z.infer<
  typeof resultsInboxSchema
>["data"][number];
export type ResultRevision = z.infer<
  typeof resultRevisionsSchema
>["data"][number];
