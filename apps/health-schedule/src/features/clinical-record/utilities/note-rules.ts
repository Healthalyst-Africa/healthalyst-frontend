import {
  CLINICAL_RECORD_PERMISSIONS,
  DEFAULT_TEMPLATE_BY_NOTE_TYPE,
  NOTE_TYPE_OPTIONS,
} from "~/features/clinical-record/config/clinical-record";
import type {
  ClinicalNote,
  NoteSection,
  NoteTemplate,
  NoteType,
} from "~/features/clinical-record/schemas/clinical-record-response-schemas";

/** The permission that lets someone write a type of note. */
export function writePermissionFor(type: NoteType): string {
  const option = NOTE_TYPE_OPTIONS.find(
    (candidate) => candidate.value === type
  );
  return option?.writer === "nurse"
    ? CLINICAL_RECORD_PERMISSIONS.writeNursingNotes
    : CLINICAL_RECORD_PERMISSIONS.writeNotes;
}

/** The note types this person may start. */
export function writableNoteTypes(permissions: readonly string[]) {
  return NOTE_TYPE_OPTIONS.filter((option) =>
    permissions.includes(writePermissionFor(option.value))
  );
}

export function describeNoteType(type: NoteType): string {
  return (
    NOTE_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type
  );
}

export function describeNoteTitle(note: Pick<ClinicalNote, "title" | "type">) {
  return note.title?.trim() || `${describeNoteType(note.type)} note`;
}

/**
 * The template a new note of this type starts from: the type's built-in
 * template, else the first switched-on template of the type.
 */
export function pickDefaultTemplate(
  templates: readonly NoteTemplate[],
  type: NoteType
): NoteTemplate | undefined {
  const offered = templates.filter(
    (template) => template.isActive && template.type === type
  );
  return (
    offered.find(
      (template) => template.id === DEFAULT_TEMPLATE_BY_NOTE_TYPE[type]
    ) ?? offered[0]
  );
}

/** Empty sections in the template's order, ready to fill in. */
export function sectionsFromTemplate(
  template: Pick<NoteTemplate, "sections"> | undefined
): NoteSection[] {
  if (!template || template.sections.length === 0) {
    return [{ key: "note", label: "Note", text: "" }];
  }
  return template.sections.map((section) => ({
    key: section.key,
    label: section.label,
    text: "",
  }));
}

/** A note can be signed once at least one section has text. */
export function hasNoteText(sections: readonly NoteSection[]): boolean {
  return sections.some((section) => section.text.trim().length > 0);
}

/**
 * The author may change a draft at any time, and a signed note until
 * `editableUntil`, 24 hours after signing. After that, an addendum.
 */
export function canEditNote(
  note: ClinicalNote,
  userId: string,
  now: Date = new Date()
): boolean {
  if (note.authorId !== userId) return false;
  if (note.status === "DRAFT") return true;
  return (
    note.status === "SIGNED" &&
    !note.locked &&
    note.editableUntil !== null &&
    new Date(note.editableUntil).getTime() > now.getTime()
  );
}

/** Only the author marks their own signed note as entered in error. */
export function canMarkNoteEnteredInError(
  note: ClinicalNote,
  userId: string
): boolean {
  return note.authorId === userId && note.status === "SIGNED";
}

/** Anyone who may write this type of note can add to a signed one. */
export function canAddAddendum(
  note: ClinicalNote,
  permissions: readonly string[]
): boolean {
  return (
    note.status === "SIGNED" &&
    permissions.includes(writePermissionFor(note.type))
  );
}

/** Notes others should see: signed ones, ones in error, and the reader's drafts. */
export function visibleNotes(notes: readonly ClinicalNote[]): ClinicalNote[] {
  return notes.filter((note) => note.status !== "DISCARDED");
}
