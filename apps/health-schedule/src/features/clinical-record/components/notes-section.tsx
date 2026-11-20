"use client";

import { useState } from "react";
import { AddIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { EmptyState } from "@healthalyst/ui/components/empty-state";
import { LoadingPlaceholder } from "@healthalyst/ui/components/loading-placeholder";
import { StateNotice } from "@healthalyst/ui/components/notice-banner";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import { DocumentsCompleteIllustration } from "@healthalyst/ui/illustrations/documents-complete-illustration";
import { NOTE_STATUS_PRESENTATION } from "~/features/clinical-record/config/clinical-record";
import {
  NoteEditorSheet,
  type NoteEditorTarget,
} from "~/features/clinical-record/components/note-editor-sheet";
import { NoteSheet } from "~/features/clinical-record/components/note-sheet";
import { usePatientNotes } from "~/features/clinical-record/hooks/use-clinical-record";
import type { ClinicalNote } from "~/features/clinical-record/schemas/clinical-record-response-schemas";
import {
  describeNoteTitle,
  describeNoteType,
  visibleNotes,
  writableNoteTypes,
} from "~/features/clinical-record/utilities/note-rules";
import { useStaffNames } from "~/shared/staff/staff-directory";
import { describeBranchDateTime } from "~/shared/time/branch-time";
import { useWorkspace } from "~/shared/workspace/workspace-context";

/** A short preview of a note's first written section. */
function previewNote(note: ClinicalNote): string {
  const firstText = note.sections.find((section) => section.text.trim())?.text;
  return firstText ? firstText.trim().slice(0, 180) : "Nothing written yet.";
}

/**
 * The patient's notes, newest first: signed notes, notes entered in error
 * (struck through), and the reader's own drafts. With a visit, only that
 * visit's notes.
 */
export function NotesSection({
  patientId,
  visitId,
  newNoteType,
}: {
  patientId: string;
  visitId?: string;
  /** The type a new note starts as, such as a consultation. */
  newNoteType?: ClinicalNote["type"];
}) {
  const { permissions } = useWorkspace();
  const describeStaff = useStaffNames();
  const notesQuery = usePatientNotes(patientId, { visitId, isEnabled: true });
  const [openNote, setOpenNote] = useState<ClinicalNote | null>(null);
  const [editorTarget, setEditorTarget] = useState<NoteEditorTarget | null>(
    null
  );
  const canWrite = writableNoteTypes(permissions).length > 0;
  const notes = visibleNotes(
    notesQuery.data?.pages.flatMap((page) => page.data) ?? []
  );

  const newNoteButton = canWrite && (
    <ActionButton
      type="button"
      leadingIcon={<AddIcon className="size-4" />}
      onClick={() =>
        setEditorTarget({ kind: "new", type: newNoteType, visitId })
      }
    >
      New note
    </ActionButton>
  );

  return (
    <div className="flex flex-col gap-4">
      {notes.length > 0 && newNoteButton && (
        <div className="flex justify-end">{newNoteButton}</div>
      )}
      {notesQuery.isPending ? (
        <LoadingPlaceholder
          label="Loading notes"
          rows={[{ shape: "card" }, { shape: "card" }]}
        />
      ) : notesQuery.isError ? (
        <StateNotice
          tone="error"
          title="We could not load the notes"
          action={
            <ActionButton
              type="button"
              variant="outline"
              onClick={() => void notesQuery.refetch()}
            >
              Try again
            </ActionButton>
          }
        >
          <p>{notesQuery.error.message}</p>
        </StateNotice>
      ) : notes.length === 0 ? (
        <EmptyState
          surface="panel"
          illustration={<DocumentsCompleteIllustration />}
          title={visitId ? "No notes for this visit yet" : "No notes yet"}
          description={
            canWrite
              ? "Notes you sign appear here for the care team."
              : "Signed notes appear here."
          }
          action={newNoteButton || undefined}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((note) => {
            const status = NOTE_STATUS_PRESENTATION[note.status];
            return (
              <li key={note.id}>
                <button
                  type="button"
                  onClick={() => setOpenNote(note)}
                  className="flex w-full flex-col gap-2 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={
                        note.status === "ENTERED_IN_ERROR"
                          ? "font-medium line-through"
                          : "font-medium"
                      }
                    >
                      {describeNoteTitle(note)}
                    </span>
                    <StatusLabel tone={status.tone}>{status.label}</StatusLabel>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {describeNoteType(note.type)} ·{" "}
                    {describeStaff(note.authorId)} ·{" "}
                    {describeBranchDateTime(note.signedAt ?? note.updatedAt)}
                    {note.addenda.length > 0 &&
                      ` · ${note.addenda.length} ${note.addenda.length === 1 ? "addendum" : "addenda"}`}
                  </span>
                  <span className="line-clamp-2 text-sm text-muted-foreground">
                    {previewNote(note)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {notesQuery.hasNextPage && (
        <ActionButton
          type="button"
          variant="outline"
          className="self-center"
          isLoading={notesQuery.isFetchingNextPage}
          loadingText="Loading"
          onClick={() => void notesQuery.fetchNextPage()}
        >
          Show earlier notes
        </ActionButton>
      )}
      <NoteSheet
        note={
          openNote
            ? (notes.find((note) => note.id === openNote.id) ?? openNote)
            : null
        }
        onOpenChange={(open) => !open && setOpenNote(null)}
        onEdit={(note) => {
          setOpenNote(null);
          setEditorTarget({ kind: "edit", note });
        }}
      />
      <NoteEditorSheet
        target={editorTarget}
        patientId={patientId}
        onOpenChange={(open) => !open && setEditorTarget(null)}
      />
    </div>
  );
}
