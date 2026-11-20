"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EditIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { DetailSheet } from "@healthalyst/ui/components/detail-sheet";
import { ExpandableSection } from "@healthalyst/ui/components/expandable-section";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { SectionHeading } from "@healthalyst/ui/components/section-heading";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import {
  CLINICAL_RECORD_LIMITS as LIMITS,
  NOTE_STATUS_PRESENTATION,
} from "~/features/clinical-record/config/clinical-record";
import {
  useNoteActions,
  useNoteRevisions,
} from "~/features/clinical-record/hooks/use-clinical-record";
import {
  addendumFormSchema,
  type AddendumFormValues,
} from "~/features/clinical-record/schemas/clinical-record-form-schemas";
import type {
  ClinicalNote,
  NoteSection,
} from "~/features/clinical-record/schemas/clinical-record-response-schemas";
import {
  canAddAddendum,
  canEditNote,
  canMarkNoteEnteredInError,
  describeNoteTitle,
  describeNoteType,
} from "~/features/clinical-record/utilities/note-rules";
import { ReasonDialog } from "~/shared/forms/reason-dialog";
import { useStaffNames } from "~/shared/staff/staff-directory";
import { describeBranchDateTime } from "~/shared/time/branch-time";
import { useWorkspace } from "~/shared/workspace/workspace-context";

/** A note's sections as headed paragraphs, keeping the writer's line breaks. */
export function NoteSections({
  sections,
  struckThrough = false,
}: {
  sections: readonly NoteSection[];
  struckThrough?: boolean;
}) {
  const filledSections = sections.filter((section) => section.text.trim());
  if (filledSections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nothing written yet.</p>
    );
  }
  return (
    <dl className="flex flex-col gap-4">
      {filledSections.map((section) => (
        <div key={section.key} className="flex flex-col gap-1">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {section.label}
          </dt>
          <dd
            className={
              struckThrough
                ? "whitespace-pre-wrap text-sm line-through"
                : "whitespace-pre-wrap text-sm"
            }
          >
            {section.text}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function AddAddendumDialog({
  note,
  open,
  onOpenChange,
}: {
  note: ClinicalNote;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addAddendum } = useNoteActions(note.patientId);
  const form = useForm<AddendumFormValues>({
    resolver: zodResolver(addendumFormSchema),
    defaultValues: { text: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ text: "" });
      addAddendum.reset();
    }
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = form.handleSubmit(({ text }) =>
    addAddendum.mutate(
      { noteId: note.id, text },
      {
        onSuccess: () => {
          announceSuccess("Addendum added");
          onOpenChange(false);
        },
      }
    )
  );

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add an addendum"
      description="It is added under the note with your name and the time. Addenda cannot be changed."
      submitLabel="Add addendum"
      submittingLabel="Adding"
      isSubmitting={addAddendum.isPending}
      error={addAddendum.error?.message}
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      <TextAreaField
        id="note-addendum"
        label="Addendum"
        required
        rows={5}
        maxLength={LIMITS.addendum}
        error={form.formState.errors.text?.message}
        {...form.register("text")}
      />
    </FormDialog>
  );
}

/** Loads when the section opens: accordion content mounts only then. */
function RevisionList({ note }: { note: ClinicalNote }) {
  const describeStaff = useStaffNames();
  const revisionsQuery = useNoteRevisions(note, true);

  if (revisionsQuery.isPending) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Loading earlier versions
      </p>
    );
  }
  if (revisionsQuery.isError) {
    return (
      <NoticeBanner tone="error" title="We could not load earlier versions">
        {revisionsQuery.error.message}
      </NoticeBanner>
    );
  }
  return (
    <ol className="flex flex-col gap-6">
      {revisionsQuery.data.map((revision) => (
        <li key={revision.savedAt} className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            Saved by {describeStaff(revision.savedById)},{" "}
            {describeBranchDateTime(revision.savedAt)}
          </p>
          <NoteSections sections={revision.sections} />
        </li>
      ))}
    </ol>
  );
}

function EarlierVersions({ note }: { note: ClinicalNote }) {
  if (note.revisions === 0) return null;
  return (
    <ExpandableSection title={`Earlier versions (${note.revisions})`}>
      <RevisionList note={note} />
    </ExpandableSection>
  );
}

/**
 * One note as the record keeps it: its sections, addenda and earlier
 * versions, and what the reader may do next.
 */
export function NoteSheet({
  note,
  onOpenChange,
  onEdit,
}: {
  note: ClinicalNote | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (note: ClinicalNote) => void;
}) {
  const { platformSession, permissions } = useWorkspace();
  const describeStaff = useStaffNames();
  const userId = platformSession.user.id;
  const actions = useNoteActions(note?.patientId ?? "");
  const [isAddingAddendum, setIsAddingAddendum] = useState(false);
  const [isMarkingError, setIsMarkingError] = useState(false);
  const status = note ? NOTE_STATUS_PRESENTATION[note.status] : null;

  return (
    <DetailSheet
      open={note !== null}
      onOpenChange={onOpenChange}
      title={note ? describeNoteTitle(note) : ""}
      titleAccessory={
        status && <StatusLabel tone={status.tone}>{status.label}</StatusLabel>
      }
      description={
        note
          ? `${describeNoteType(note.type)} · ${describeStaff(note.authorId)} · ${describeBranchDateTime(note.signedAt ?? note.updatedAt)}`
          : undefined
      }
      footer={
        note && (
          <>
            {canMarkNoteEnteredInError(note, userId) && (
              <ActionButton
                type="button"
                variant="outline"
                className="text-destructive sm:mr-auto"
                onClick={() => {
                  actions.markEnteredInError.reset();
                  setIsMarkingError(true);
                }}
              >
                Mark entered in error
              </ActionButton>
            )}
            {canAddAddendum(note, permissions) && (
              <ActionButton
                type="button"
                variant="outline"
                onClick={() => setIsAddingAddendum(true)}
              >
                Add addendum
              </ActionButton>
            )}
            {canEditNote(note, userId) && (
              <ActionButton
                type="button"
                leadingIcon={<EditIcon className="size-4" />}
                onClick={() => onEdit(note)}
              >
                {note.status === "DRAFT" ? "Continue writing" : "Edit note"}
              </ActionButton>
            )}
          </>
        )
      }
    >
      {note && (
        <div className="flex flex-col gap-8">
          {note.enteredInError && (
            <NoticeBanner tone="error" title="Entered in error">
              {note.enteredInError.reason} (
              {describeStaff(note.enteredInError.byId)},{" "}
              {describeBranchDateTime(note.enteredInError.at)})
            </NoticeBanner>
          )}
          {note.status === "DRAFT" && (
            <NoticeBanner tone="information" title="Draft">
              Only you can see it until you sign it.
            </NoticeBanner>
          )}
          <NoteSections
            sections={note.sections}
            struckThrough={note.status === "ENTERED_IN_ERROR"}
          />
          {note.addenda.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionHeading heading="Addenda" />
              <ol className="flex flex-col gap-4">
                {note.addenda.map((addendum) => (
                  <li
                    key={addendum.id}
                    className="flex flex-col gap-1 border-t border-border pt-3"
                  >
                    <p className="text-xs text-muted-foreground">
                      {describeStaff(addendum.authorId)},{" "}
                      {describeBranchDateTime(addendum.createdAt)}
                    </p>
                    <p className="whitespace-pre-wrap text-sm">
                      {addendum.text}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}
          <EarlierVersions note={note} />
          <AddAddendumDialog
            note={note}
            open={isAddingAddendum}
            onOpenChange={setIsAddingAddendum}
          />
          <ReasonDialog
            open={isMarkingError}
            onOpenChange={setIsMarkingError}
            identifier="note-entered-in-error"
            title="Mark this note as entered in error?"
            description="It stays in the record, struck through, with your reason. Write a new note if the content belongs elsewhere."
            reasonLabel="What is wrong with it"
            reasonHint="For example, written on the wrong patient's record."
            minimumLength={LIMITS.errorReasonMinimum}
            maximumLength={LIMITS.errorReasonMaximum}
            submitLabel="Mark entered in error"
            submittingLabel="Saving"
            tone="destructive"
            isSubmitting={actions.markEnteredInError.isPending}
            error={actions.markEnteredInError.error?.message}
            onSubmit={(reason) =>
              actions.markEnteredInError.mutate(
                { noteId: note.id, reason },
                {
                  onSuccess: () => {
                    announceSuccess("Note marked as entered in error");
                    setIsMarkingError(false);
                    onOpenChange(false);
                  },
                }
              )
            }
          />
        </div>
      )}
    </DetailSheet>
  );
}
