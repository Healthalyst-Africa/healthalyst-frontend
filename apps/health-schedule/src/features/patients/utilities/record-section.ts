import { PATIENT_RECORD_SECTIONS } from "~/features/patients/config/patients";

export type RecordSection = (typeof PATIENT_RECORD_SECTIONS)[number]["value"];

/** The tab named in the address, or the overview for anything else. */
export function readRecordSection(value: string | null): RecordSection {
  return (
    PATIENT_RECORD_SECTIONS.find((section) => section.value === value)?.value ??
    PATIENT_RECORD_SECTIONS[0].value
  );
}
