import { z } from "zod";
import { CLINICAL_RECORD_LIMITS as LIMITS } from "~/features/clinical-record/config/clinical-record";

/** A reason that is kept with the record, such as for an entry in error. */
export function reasonSchema(minimum: number, maximum: number) {
  return z
    .string()
    .trim()
    .min(minimum, `Give a reason of at least ${minimum} characters.`)
    .max(maximum, `Use ${maximum} characters or fewer.`);
}

export const noteFormSchema = z.object({
  title: z
    .string()
    .trim()
    .max(LIMITS.noteTitle, `Use ${LIMITS.noteTitle} characters or fewer.`),
  sections: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        text: z
          .string()
          .max(
            LIMITS.sectionText,
            `Use ${LIMITS.sectionText.toLocaleString("en-GB")} characters or fewer.`
          ),
      })
    )
    .max(LIMITS.sectionsMaximum),
});

export const addendumFormSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Write the addendum.")
    .max(
      LIMITS.addendum,
      `Use ${LIMITS.addendum.toLocaleString("en-GB")} characters or fewer.`
    ),
});

export const enteredInErrorFormSchema = z.object({
  reason: reasonSchema(LIMITS.errorReasonMinimum, LIMITS.errorReasonMaximum),
});

export const problemFormSchema = z
  .object({
    entry: z.enum(["code", "words"]),
    code: z.string(),
    title: z.string().trim(),
    onsetDate: z.string(),
    notes: z
      .string()
      .trim()
      .max(
        LIMITS.problemNotes,
        `Use ${LIMITS.problemNotes.toLocaleString("en-GB")} characters or fewer.`
      ),
  })
  .superRefine((values, context) => {
    if (values.entry === "code" && !values.code) {
      context.addIssue({
        code: "custom",
        path: ["code"],
        message: "Search for the diagnosis and choose it.",
      });
    }
    if (
      values.entry === "words" &&
      values.title.length < LIMITS.problemTitleMinimum
    ) {
      context.addIssue({
        code: "custom",
        path: ["title"],
        message: "Describe the problem in a few words.",
      });
    }
    if (values.title.length > LIMITS.problemTitle) {
      context.addIssue({
        code: "custom",
        path: ["title"],
        message: `Use ${LIMITS.problemTitle} characters or fewer.`,
      });
    }
  });

const TEMPLATE_SECTION_KEY_PATTERN = /^[a-z][a-z0-9_]{0,39}$/;

export const noteTemplateFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name the template.")
      .max(
        LIMITS.templateName,
        `Use ${LIMITS.templateName} characters or fewer.`
      ),
    type: z.enum([
      "CONSULTATION",
      "WARD_ROUND",
      "PROCEDURE",
      "DISCHARGE_SUMMARY",
      "ANTENATAL",
      "NURSING",
      "HANDOVER",
    ]),
    sections: z
      .array(
        z.object({
          label: z
            .string()
            .trim()
            .min(1, "Name the section.")
            .max(
              LIMITS.sectionLabel,
              `Use ${LIMITS.sectionLabel} characters or fewer.`
            ),
          hint: z
            .string()
            .trim()
            .max(
              LIMITS.sectionHint,
              `Use ${LIMITS.sectionHint} characters or fewer.`
            ),
        })
      )
      .min(1, "Add at least one section.")
      .max(
        LIMITS.sectionsMaximum,
        `Use ${LIMITS.sectionsMaximum} sections or fewer.`
      ),
    isActive: z.boolean(),
  })
  .superRefine((values, context) => {
    const seenKeys = new Set<string>();
    values.sections.forEach((section, sectionIndex) => {
      const key = toSectionKey(section.label);
      if (!TEMPLATE_SECTION_KEY_PATTERN.test(key)) {
        context.addIssue({
          code: "custom",
          path: ["sections", sectionIndex, "label"],
          message: "Start the name with a letter.",
        });
      } else if (seenKeys.has(key)) {
        context.addIssue({
          code: "custom",
          path: ["sections", sectionIndex, "label"],
          message: "Two sections have the same name.",
        });
      }
      seenKeys.add(key);
    });
  });

/**
 * A section's stored key from its name, such as "Past history" to
 * `past_history`, as the API requires.
 */
export function toSectionKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

export type NoteFormValues = z.infer<typeof noteFormSchema>;
export type AddendumFormValues = z.infer<typeof addendumFormSchema>;
export type EnteredInErrorFormValues = z.infer<typeof enteredInErrorFormSchema>;
export type ProblemFormValues = z.infer<typeof problemFormSchema>;
export type NoteTemplateFormValues = z.infer<typeof noteTemplateFormSchema>;
