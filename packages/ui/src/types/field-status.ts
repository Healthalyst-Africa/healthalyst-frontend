/** Live feedback about a field's value that is not an error. */
export type FieldStatus = {
  tone: "neutral" | "success";
  message: string;
};
