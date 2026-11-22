/** One stop on a patient's visit, such as "Vital signs". */
export type VisitProgressStep = {
  label: string;
  state: "done" | "current" | "upcoming";
  /** More about the current stop, such as "Waiting 12 min". */
  detail?: string;
};
