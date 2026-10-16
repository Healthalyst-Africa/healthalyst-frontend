import { z } from "zod";

export const reviewDecisionSchema = z
  .object({
    status: z.enum(["CHANGES_REQUESTED", "APPROVED", "REJECTED"]),
    note: z
      .string()
      .trim()
      .max(1000, "Review notes must be no more than 1,000 characters."),
  })
  .refine(
    (decision) => decision.status === "APPROVED" || decision.note.length > 0,
    {
      error: "Add a note for a request for changes or rejection.",
      path: ["note"],
    }
  );

export const evidenceRequestSchema = z.object({
  title: z.string().trim().min(3, "Enter a clear evidence title.").max(160),
  instructions: z
    .string()
    .trim()
    .min(5, "Explain what the organisation must provide.")
    .max(1000),
});

export const evidenceReviewSchema = z
  .object({
    accepted: z.boolean(),
    note: z
      .string()
      .trim()
      .max(1000, "Review notes must be no more than 1,000 characters."),
  })
  .refine((decision) => decision.accepted || decision.note.length > 0, {
    error: "Explain what must change.",
    path: ["note"],
  });
