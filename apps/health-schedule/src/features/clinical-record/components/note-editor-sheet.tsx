"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { DetailSheet } from "@healthalyst/ui/components/detail-sheet";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { FormMessage } from "@healthalyst/ui/components/form-message";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { TextField } from "@healthalyst/ui/components/text-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { CLINICAL_RECORD_LIMITS as LIMITS } from "~/features/clinical-record/config/clinical-record";
import {
  useNoteActions,
  useNoteTemplates,
} from "~/features/clinical-record/hooks/use-clinical-record";
import {
  noteFormSchema,
  type NoteFormValues,
} from "~/features/clinical-record/schemas/clinical-record-form-schemas";
import type {
  ClinicalNote,
  NoteSection,
  NoteType,
} from "~/features/clinical-record/schemas/clinical-record-response-schemas";
import {
  describeNoteType,
  hasNoteText,
  pickDefaultTemplate,
  sectionsFromTemplate,
  writableNoteTypes,
} from "~/features/clinical-record/utilities/note-rules";
import { describeBranchDateTime } from "~/shared/time/branch-time";
import { useWorkspace } from "~/shared/workspace/workspace-context";

/** What the editor opens on: a new note, or a saved one to change. */
export type NoteEditorTarget =
  | { kind: "new"; type?: NoteType; visitId?: string }
  | { kind: "edit"; note: ClinicalNote };

/** Keeps text already typed in sections that carry over to another template. */
function mergeSections(
  nextSections: readonly NoteSection[],
  currentSections: readonly NoteSection[]
): NoteSection[] {
  return nextSections.map((section) => ({
    ...section,
    text:
      currentSections.find((current) => current.key === section.key)?.text ??
      "",
  }));
}

/**
 * Writes a clinical note. A new note becomes a draft only its author sees;
 * signing makes it part of the record. A signed note can be changed for 24
 * hours, keeping every earlier version.
 */
export function NoteEditorSheet({
  target,
  patientId,
  onOpenChange,
  onSaved,
}: {
  /** Null while the editor is closed. */
  target: NoteEditorTarget | null;
  patientId: string;
  onOpenChange: (open: boolean) => void;
  onSaved?: (note: ClinicalNote) => void;
}) {
  const { permissions } = useWorkspace();
  const typeOptions = writableNoteTypes(permissions);
  const templatesQuery = useNoteTemplates(target !== null);
  const actions = useNoteActions(patientId);
  const [savedNote, setSavedNote] = useState<ClinicalNote | null>(null);
  const [newNoteIdentifier, setNewNoteIdentifier] = useState("");
  const [noteType, setNoteType] = useState<NoteType>("CONSULTATION");
  const [templateIdentifier, setTemplateIdentifier] = useState("");
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: { title: "", sections: [] },
  });
  const sections = useWatch({ control: form.control, name: "sections" }) ?? [];
  const templates = useMemo(
    () => templatesQuery.data ?? [],
    [templatesQuery.data]
  );
  const offeredTemplates = templates.filter(
    (template) => template.isActive && template.type === noteType
  );

  // Open on the note, or on a new note's default type and template.
  useEffect(() => {
    if (!target) return;
    setSignError(null);
    for (const mutation of Object.values(actions)) mutation.reset();
    if (target.kind === "edit") {
      setSavedNote(target.note);
      setNoteType(target.note.type);
      setTemplateIdentifier(target.note.templateId ?? "");
      form.reset({
        title: target.note.title ?? "",
        sections: target.note.sections,
      });
      return;
    }
    const firstType =
      target.type && typeOptions.some((option) => option.value === target.type)
        ? target.type
        : (typeOptions[0]?.value ?? "CONSULTATION");
    setSavedNote(null);
    setNewNoteIdentifier(globalThis.crypto.randomUUID());
    setNoteType(firstType);
    setTemplateIdentifier("");
    form.reset({ title: "", sections: [] });
    // Start again each time the editor opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  // A new note follows its template until it is first saved.
  useEffect(() => {
    if (target?.kind !== "new" || savedNote || templates.length === 0) return;
    const template =
      offeredTemplates.find(
        (candidate) => candidate.id === templateIdentifier
      ) ?? pickDefaultTemplate(templates, noteType);
    if (template && template.id !== templateIdentifier) {
      setTemplateIdentifier(template.id);
    }
    form.setValue(
      "sections",
      mergeSections(sectionsFromTemplate(template), form.getValues("sections"))
    );
    // Follow the chosen type and template only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteType, templateIdentifier, templates, savedNote, target]);

  const isSigned = savedNote?.status === "SIGNED";
  const template = templates.find(
    (candidate) => candidate.id === templateIdentifier
  );
  const isBusy =
    actions.create.isPending ||
    actions.update.isPending ||
    actions.sign.isPending;
  const saveError =
    actions.create.error?.message ??
    actions.update.error?.message ??
    signError ??
    actions.sign.error?.message;

  async function saveValues(values: NoteFormValues): Promise<ClinicalNote> {
    const sectionsToSave = values.sections.map((section) => ({
      key: section.key,
      label: section.label,
      text: section.text,
    }));
    const note = savedNote
      ? await actions.update.mutateAsync({
          note: savedNote,
          changes: { title: values.title || null, sections: sectionsToSave },
        })
      : await actions.create.mutateAsync({
          id: newNoteIdentifier,
          type: noteType,
          ...(target?.kind === "new" && target.visitId
            ? { visitId: target.visitId }
            : {}),
          ...(templateIdentifier ? { templateId: templateIdentifier } : {}),
          ...(values.title ? { title: values.title } : {}),
          sections: sectionsToSave,
        });
    setSavedNote(note);
    return note;
  }

  const saveDraft = form.handleSubmit(async (values) => {
    try {
      const note = await saveValues(values);
      announceSuccess(isSigned ? "Changes saved" : "Draft saved");
      onSaved?.(note);
      onOpenChange(false);
    } catch {
      // The mutation's error is shown in the form.
    }
  });

  const saveAndSign = form.handleSubmit(async (values) => {
    setSignError(null);
    if (!hasNoteText(values.sections)) {
      setSignError("Write in at least one section before signing.");
      return;
    }
    try {
      const note = await saveValues(values);
      const signedNote = await actions.sign.mutateAsync(note.id);
      announceSuccess("Note signed");
      onSaved?.(signedNote);
      onOpenChange(false);
    } catch {
      // The mutation's error is shown in the form.
    }
  });

  return (
    <>
      <DetailSheet
        open={target !== null}
        onOpenChange={onOpenChange}
        title={
          savedNote
            ? isSigned
              ? `Edit ${describeNoteType(savedNote.type).toLowerCase()} note`
              : `${describeNoteType(savedNote.type)} note, draft`
            : "New note"
        }
        description={
          isSigned && savedNote?.editableUntil
            ? `You can change it until ${describeBranchDateTime(savedNote.editableUntil)}. Earlier versions are kept.`
            : "Only you can see a draft. Signing adds it to the patient's record."
        }
        footer={
          <>
            {savedNote?.status === "DRAFT" && (
              <ActionButton
                type="button"
                variant="outline"
                className="text-destructive sm:mr-auto"
                disabled={isBusy}
                onClick={() => {
                  actions.discard.reset();
                  setIsConfirmingDiscard(true);
                }}
              >
                Discard draft
              </ActionButton>
            )}
            <ActionButton
              type="button"
              variant={isSigned ? "default" : "outline"}
              disabled={isBusy}
              isLoading={actions.create.isPending || actions.update.isPending}
              loadingText="Saving"
              onClick={() => void saveDraft()}
            >
              {isSigned ? "Save changes" : "Save draft"}
            </ActionButton>
            {!isSigned && (
              <ActionButton
                type="button"
                disabled={isBusy}
                isLoading={actions.sign.isPending}
                loadingText="Signing"
                onClick={() => void saveAndSign()}
              >
                Sign note
              </ActionButton>
            )}
          </>
        }
      >
        <form
          noValidate
          className="flex flex-col gap-5"
          onSubmit={(formEvent) => {
            formEvent.preventDefault();
            void saveDraft();
          }}
        >
          {!savedNote && (
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                id="note-type"
                label="Type of note"
                placeholder="Choose a type"
                options={typeOptions}
                value={noteType}
                onValueChange={(value) => {
                  setNoteType(value as NoteType);
                  setTemplateIdentifier("");
                }}
              />
              <SelectField
                id="note-template"
                label="Template"
                placeholder={
                  templatesQuery.isPending
                    ? "Loading templates…"
                    : "Choose a template"
                }
                options={offeredTemplates.map((candidate) => ({
                  value: candidate.id,
                  label: candidate.name,
                }))}
                value={templateIdentifier}
                disabled={templatesQuery.isPending}
                onValueChange={setTemplateIdentifier}
              />
            </div>
          )}
          {templatesQuery.isError && !savedNote && (
            <NoticeBanner
              tone="warning"
              title="We could not load the templates"
            >
              You can still write the note in one section.
            </NoticeBanner>
          )}
          <TextField
            id="note-title"
            label="Title"
            placeholder={`${describeNoteType(noteType)} note`}
            maxLength={LIMITS.noteTitle}
            error={form.formState.errors.title?.message}
            {...form.register("title")}
          />
          {sections.map((section, sectionIndex) => (
            <TextAreaField
              key={section.key}
              id={`note-section-${section.key}`}
              label={section.label}
              description={
                template?.sections.find(
                  (templateSection) => templateSection.key === section.key
                )?.hint
              }
              rows={4}
              maxLength={LIMITS.sectionText}
              error={
                form.formState.errors.sections?.[sectionIndex]?.text?.message
              }
              {...form.register(`sections.${sectionIndex}.text`)}
            />
          ))}
          {saveError && <FormMessage tone="error">{saveError}</FormMessage>}
        </form>
      </DetailSheet>
      <FormDialog
        open={isConfirmingDiscard}
        onOpenChange={setIsConfirmingDiscard}
        title="Discard this draft?"
        description="It is deleted for good. Nobody else has seen it."
        submitLabel="Discard draft"
        submittingLabel="Discarding"
        tone="destructive"
        isSubmitting={actions.discard.isPending}
        error={actions.discard.error?.message}
        onSubmit={(formEvent) => {
          formEvent.preventDefault();
          if (!savedNote) return;
          actions.discard.mutate(savedNote.id, {
            onSuccess: () => {
              announceSuccess("Draft discarded");
              setIsConfirmingDiscard(false);
              onOpenChange(false);
            },
          });
        }}
      >
        {null}
      </FormDialog>
    </>
  );
}
