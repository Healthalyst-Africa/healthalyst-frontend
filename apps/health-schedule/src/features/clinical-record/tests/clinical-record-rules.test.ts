import { describe, expect, it } from "vitest";
import {
  noteTemplateFormSchema,
  problemFormSchema,
  toSectionKey,
} from "~/features/clinical-record/schemas/clinical-record-form-schemas";
import type {
  ClinicalNote,
  NoteTemplate,
  Problem,
} from "~/features/clinical-record/schemas/clinical-record-response-schemas";
import {
  canAddAddendum,
  canEditNote,
  canMarkNoteEnteredInError,
  describeNoteTitle,
  hasNoteText,
  pickDefaultTemplate,
  sectionsFromTemplate,
  visibleNotes,
  writableNoteTypes,
} from "~/features/clinical-record/utilities/note-rules";
import {
  describeProblemCode,
  orderProblems,
  toCreateProblemRequest,
} from "~/features/clinical-record/utilities/problem-rules";

const AUTHOR = "6f1c2d3e-4b5a-4c6d-8e7f-0a1b2c3d4e5f";
const SOMEONE_ELSE = "7a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";
const NOW = new Date("2026-11-20T12:00:00Z");

function note(changes: Partial<ClinicalNote> = {}): ClinicalNote {
  return {
    id: "note-1",
    patientId: "patient-1",
    visitId: null,
    type: "CONSULTATION",
    templateId: "soap",
    title: null,
    sections: [{ key: "subjective", label: "Subjective", text: "Fever" }],
    status: "SIGNED",
    authorId: AUTHOR,
    createdAt: "2026-11-20T09:00:00Z",
    updatedAt: "2026-11-20T09:30:00Z",
    signedAt: "2026-11-20T09:30:00Z",
    editableUntil: "2026-11-21T09:30:00Z",
    locked: false,
    version: 2,
    revisions: 0,
    addenda: [],
    enteredInError: null,
    ...changes,
  };
}

function template(changes: Partial<NoteTemplate>): NoteTemplate {
  return {
    id: "soap",
    name: "SOAP",
    type: "CONSULTATION",
    sections: [
      { key: "subjective", label: "Subjective" },
      { key: "plan", label: "Plan", hint: "Treatment and follow-up" },
    ],
    builtIn: true,
    isActive: true,
    version: 1,
    ...changes,
  };
}

describe("who may write which note", () => {
  it("offers doctors' types with note:write and nursing types with note:nursing", () => {
    expect(
      writableNoteTypes(["note:write"]).map((option) => option.value)
    ).toEqual([
      "CONSULTATION",
      "WARD_ROUND",
      "PROCEDURE",
      "DISCHARGE_SUMMARY",
      "ANTENATAL",
    ]);
    expect(
      writableNoteTypes(["note:nursing"]).map((option) => option.value)
    ).toEqual(["NURSING", "HANDOVER"]);
    expect(writableNoteTypes(["note:read"])).toEqual([]);
  });

  it("lets the author change a draft, or a signed note for 24 hours", () => {
    expect(
      canEditNote(note({ status: "DRAFT", editableUntil: null }), AUTHOR, NOW)
    ).toBe(true);
    expect(canEditNote(note(), AUTHOR, NOW)).toBe(true);
    expect(
      canEditNote(note({ editableUntil: "2026-11-20T11:00:00Z" }), AUTHOR, NOW)
    ).toBe(false);
    expect(canEditNote(note({ locked: true }), AUTHOR, NOW)).toBe(false);
    expect(canEditNote(note(), SOMEONE_ELSE, NOW)).toBe(false);
  });

  it("lets only the author mark their signed note as entered in error", () => {
    expect(canMarkNoteEnteredInError(note(), AUTHOR)).toBe(true);
    expect(canMarkNoteEnteredInError(note(), SOMEONE_ELSE)).toBe(false);
    expect(canMarkNoteEnteredInError(note({ status: "DRAFT" }), AUTHOR)).toBe(
      false
    );
  });

  it("lets anyone who writes that type add an addendum to a signed note", () => {
    expect(canAddAddendum(note(), ["note:write"])).toBe(true);
    expect(canAddAddendum(note(), ["note:nursing"])).toBe(false);
    expect(canAddAddendum(note({ type: "NURSING" }), ["note:nursing"])).toBe(
      true
    );
    expect(canAddAddendum(note({ status: "DRAFT" }), ["note:write"])).toBe(
      false
    );
  });

  it("hides discarded drafts", () => {
    expect(
      visibleNotes([note(), note({ id: "gone", status: "DISCARDED" })]).map(
        (visibleNote) => visibleNote.id
      )
    ).toEqual(["note-1"]);
  });

  it("names a note by its title, or by its type", () => {
    expect(describeNoteTitle(note({ title: "Follow-up" }))).toBe("Follow-up");
    expect(describeNoteTitle(note({ title: "  " }))).toBe("Consultation note");
  });
});

describe("templates", () => {
  const templates = [
    template({ id: "custom", name: "Diabetes review", builtIn: false }),
    template({}),
    template({ id: "old", name: "Old", isActive: false, builtIn: false }),
  ];

  it("starts a note from the type's built-in template", () => {
    expect(pickDefaultTemplate(templates, "CONSULTATION")?.id).toBe("soap");
  });

  it("falls back to the first switched-on template of the type", () => {
    expect(pickDefaultTemplate(templates.slice(0, 1), "CONSULTATION")?.id).toBe(
      "custom"
    );
    expect(pickDefaultTemplate(templates, "NURSING")).toBeUndefined();
  });

  it("turns a template into empty sections, or one section without one", () => {
    expect(sectionsFromTemplate(template({}))).toEqual([
      { key: "subjective", label: "Subjective", text: "" },
      { key: "plan", label: "Plan", text: "" },
    ]);
    expect(sectionsFromTemplate(undefined)).toEqual([
      { key: "note", label: "Note", text: "" },
    ]);
  });

  it("needs text in at least one section to sign", () => {
    expect(hasNoteText([{ key: "plan", label: "Plan", text: "  " }])).toBe(
      false
    );
    expect(hasNoteText([{ key: "plan", label: "Plan", text: "Rest" }])).toBe(
      true
    );
  });

  it("names sections as the API stores them and refuses clashes", () => {
    expect(toSectionKey("Past medical history")).toBe("past_medical_history");
    expect(toSectionKey("  Plan / follow-up ")).toBe("plan_follow_up");
    const result = noteTemplateFormSchema.safeParse({
      name: "Review",
      type: "CONSULTATION",
      sections: [
        { label: "Plan", hint: "" },
        { label: "plan", hint: "" },
        { label: "1st visit", hint: "" },
      ],
      isActive: true,
    });
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      "Two sections have the same name.",
      "Start the name with a letter.",
    ]);
  });
});

describe("problems", () => {
  function problem(changes: Partial<Problem>): Problem {
    return {
      id: "problem",
      patientId: "patient-1",
      system: "ICD-11",
      code: "1F40.Z",
      title: "Malaria",
      status: "ACTIVE",
      onsetDate: null,
      resolvedDate: null,
      notes: null,
      visitId: null,
      noteId: null,
      errorReason: null,
      createdById: AUTHOR,
      createdAt: "2026-11-01T09:00:00Z",
      updatedAt: "2026-11-01T09:00:00Z",
      version: 1,
      ...changes,
    };
  }

  it("records a coded diagnosis by code, linked to the visit", () => {
    expect(
      toCreateProblemRequest(
        {
          entry: "code",
          code: "1F40.Z",
          title: "Malaria",
          onsetDate: "2026-11-18",
          notes: " ",
        },
        { id: "new-problem", visitId: "visit-1" }
      )
    ).toEqual({
      id: "new-problem",
      code: "1F40.Z",
      onsetDate: "2026-11-18",
      visitId: "visit-1",
    });
  });

  it("records a problem in words without a code", () => {
    expect(
      toCreateProblemRequest(
        {
          entry: "words",
          code: "",
          title: " Chest pain ",
          onsetDate: "",
          notes: "Worse on exertion",
        },
        { id: "new-problem" }
      )
    ).toEqual({
      id: "new-problem",
      title: "Chest pain",
      notes: "Worse on exertion",
    });
  });

  it("asks for a chosen diagnosis or a description", () => {
    const empty = { code: "", title: "", onsetDate: "", notes: "" };
    expect(
      problemFormSchema.safeParse({ entry: "code", ...empty }).error?.issues[0]
        ?.path
    ).toEqual(["code"]);
    expect(
      problemFormSchema.safeParse({ entry: "words", ...empty }).error?.issues[0]
        ?.path
    ).toEqual(["title"]);
  });

  it("lists problems in force first, then resolved, then entries in error", () => {
    expect(
      orderProblems([
        problem({ id: "error", status: "ENTERED_IN_ERROR" }),
        problem({ id: "resolved", status: "RESOLVED" }),
        problem({ id: "older", createdAt: "2026-10-01T09:00:00Z" }),
        problem({ id: "newer", createdAt: "2026-11-10T09:00:00Z" }),
      ]).map((orderedProblem) => orderedProblem.id)
    ).toEqual(["newer", "older", "resolved", "error"]);
  });

  it("shows the ICD-11 code, or nothing for a problem in words", () => {
    expect(describeProblemCode(problem({}))).toBe("ICD-11 1F40.Z");
    expect(
      describeProblemCode(problem({ code: null, system: null }))
    ).toBeNull();
  });
});
