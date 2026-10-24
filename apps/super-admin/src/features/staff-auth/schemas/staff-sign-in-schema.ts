import { z as schemaLibrary } from "zod";

export const staffSignInSchema = schemaLibrary.object({
  emailAddress: schemaLibrary.email("Enter a valid work email address."),
  password: schemaLibrary.string().min(1, "Enter your password."),
});
