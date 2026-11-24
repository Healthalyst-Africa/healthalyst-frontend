import { z } from "zod";
import { ORDER_LIMITS } from "~/features/orders/config/orders";

/** Tests and scans sent together, with one priority and clinical question. */
export const orderFormSchema = z.object({
  serviceIds: z
    .array(z.string())
    .min(1, "Add at least one test or scan")
    .max(
      ORDER_LIMITS.itemsPerOrder,
      `Send up to ${ORDER_LIMITS.itemsPerOrder} tests and scans at once`
    ),
  priority: z.enum(["ROUTINE", "URGENT", "STAT"]),
  indication: z
    .string()
    .trim()
    .max(
      ORDER_LIMITS.indication,
      `Use ${ORDER_LIMITS.indication} characters or fewer`
    ),
});

export const cancelOrderFormSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(ORDER_LIMITS.cancelReason.minimum, "Say why, in a few words")
    .max(
      ORDER_LIMITS.cancelReason.maximum,
      `Use ${ORDER_LIMITS.cancelReason.maximum} characters or fewer`
    ),
});

export type OrderFormValues = z.input<typeof orderFormSchema>;
export type CancelOrderFormValues = z.input<typeof cancelOrderFormSchema>;
