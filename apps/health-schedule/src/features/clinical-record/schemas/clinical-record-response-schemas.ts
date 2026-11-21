import { z } from "zod";

export const noteTypeSchema = z.enum([
  "CONSULTATION",
  "WARD_ROUND",
  "PROCEDURE",
  "DISCHARGE_SUMMARY",
  "ANTENATAL",
  "NURSING",
  "HANDOVER",
]);

export const noteSectionSchema = z.object({
  key: z.string(),
  label: z.string(),
  text: z.string(),
});

export const clinicalNoteSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  visitId: z.string().nullable(),
  type: noteTypeSchema,
  templateId: z.string().nullable(),
  title: z.string().nullable(),
  sections: z.array(noteSectionSchema),
  status: z.enum(["DRAFT", "SIGNED", "ENTERED_IN_ERROR", "DISCARDED"]),
  authorId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  signedAt: z.string().nullable(),
  editableUntil: z.string().nullable(),
  locked: z.boolean(),
  version: z.number().int(),
  revisions: z.number().int(),
  addenda: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      authorId: z.string(),
      createdAt: z.string(),
    })
  ),
  enteredInError: z
    .object({ reason: z.string(), byId: z.string(), at: z.string() })
    .nullable(),
});

export const clinicalNoteListSchema = z.object({
  data: z.array(clinicalNoteSchema),
  nextBefore: z.string().nullable(),
});

export const noteRevisionListSchema = z.object({
  data: z.array(
    z.object({
      sections: z.array(noteSectionSchema),
      savedById: z.string(),
      savedAt: z.string(),
    })
  ),
});

export const noteTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: noteTypeSchema,
  sections: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      hint: z.string().optional(),
    })
  ),
  builtIn: z.boolean(),
  isActive: z.boolean(),
  version: z.number().int(),
});

export const noteTemplateListSchema = z.object({
  data: z.array(noteTemplateSchema),
});

export const timelineSchema = z.object({
  restricted: z.boolean(),
  data: z.array(
    z.object({
      at: z.string(),
      kind: z.enum(["VISIT", "TRIAGE", "NOTE", "DOCUMENT"]),
      id: z.string(),
      visitId: z.string().nullable(),
      title: z.string(),
      detail: z.string().nullable(),
      status: z.string().nullable(),
    })
  ),
  nextBefore: z.string().nullable(),
});

export const diagnosisListSchema = z.object({
  data: z.array(
    z.object({
      system: z.literal("ICD-11"),
      code: z.string(),
      title: z.string(),
      parentCode: z.string().nullable(),
      selectable: z.boolean(),
    })
  ),
});

export const problemSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  system: z.literal("ICD-11").nullable(),
  code: z.string().nullable(),
  title: z.string(),
  status: z.enum(["ACTIVE", "RESOLVED", "ENTERED_IN_ERROR"]),
  onsetDate: z.string().nullable(),
  resolvedDate: z.string().nullable(),
  notes: z.string().nullable(),
  visitId: z.string().nullable(),
  noteId: z.string().nullable(),
  errorReason: z.string().nullable(),
  createdById: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().int(),
});

export const problemListSchema = z.object({ data: z.array(problemSchema) });

export type NoteType = z.infer<typeof noteTypeSchema>;
export type NoteSection = z.infer<typeof noteSectionSchema>;
export type ClinicalNote = z.infer<typeof clinicalNoteSchema>;
export type ClinicalNoteList = z.infer<typeof clinicalNoteListSchema>;
export type NoteRevision = z.infer<
  typeof noteRevisionListSchema
>["data"][number];
export type NoteTemplate = z.infer<typeof noteTemplateSchema>;
export type Timeline = z.infer<typeof timelineSchema>;
export type TimelineEntry = Timeline["data"][number];
export type Diagnosis = z.infer<typeof diagnosisListSchema>["data"][number];
export type Problem = z.infer<typeof problemSchema>;
