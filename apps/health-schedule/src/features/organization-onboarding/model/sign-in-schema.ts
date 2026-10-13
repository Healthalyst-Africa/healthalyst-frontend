import { z } from "zod";

export function createSignInSchema(organizationSelectionRequired: boolean) {
  return z
    .object({
      emailAddress: z
        .string({ error: "Work email address is required." })
        .trim()
        .min(1, { error: "Work email address is required." })
        .max(254, {
          error: "Work email address must be no more than 254 characters.",
        })
        .pipe(z.email({ error: "Enter a valid email address." })),
      password: z
        .string({ error: "Password is required." })
        .min(1, { error: "Password is required." })
        .max(128, { error: "Password must be no more than 128 characters." }),
      organizationId: z.preprocess(
        (value) => (value === "" ? undefined : value),
        z.uuid({ error: "Select a valid organisation." }).optional()
      ),
    })
    .refine(
      (values) =>
        !organizationSelectionRequired || Boolean(values.organizationId),
      {
        error: "Choose an organisation.",
        path: ["organizationId"],
      }
    );
}
