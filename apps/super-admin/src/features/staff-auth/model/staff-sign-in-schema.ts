import { z } from "zod";

export const staffSignInSchema = z.object({
  emailAddress: z.email("Enter a valid work email address."),
  password: z.string().min(1, "Enter your password."),
});
