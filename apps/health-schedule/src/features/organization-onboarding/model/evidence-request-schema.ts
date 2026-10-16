import { z } from "zod";

export const evidenceRequestSchema = z.object({
  title: z.string().trim().min(3, "Enter a clear evidence title.").max(160),
  instructions: z
    .string()
    .trim()
    .min(5, "Explain what the organisation must provide.")
    .max(1000, "Instructions must be no more than 1,000 characters."),
});

export const evidenceReviewSchema = z
  .object({
    accepted: z.enum(["true", "false"]).transform((value) => value === "true"),
    note: z
      .string()
      .trim()
      .max(1000, "Review notes must be no more than 1,000 characters."),
  })
  .refine((review) => review.accepted || review.note.length > 0, {
    error: "Add a note explaining what must change.",
    path: ["note"],
  });

export const evidenceDocumentUploadSchema = z.object({
  file: z
    .custom<File>(
      (value) => typeof File !== "undefined" && value instanceof File,
      "Choose a file to upload."
    )
    .refine((file) => file.size > 0, "Choose a file to upload.")
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      "The file must be 10 MB or smaller."
    )
    .refine(
      (file) => /\.(pdf|jpe?g|png)$/i.test(file.name),
      "Choose a PDF, JPEG, or PNG document."
    ),
});
