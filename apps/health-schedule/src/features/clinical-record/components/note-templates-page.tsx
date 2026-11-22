"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddIcon, DeleteIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { CheckboxField } from "@healthalyst/ui/components/checkbox-field";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { DetailSheet } from "@healthalyst/ui/components/detail-sheet";
import { FormMessage } from "@healthalyst/ui/components/form-message";
import { StateNotice } from "@healthalyst/ui/components/notice-banner";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { TextField } from "@healthalyst/ui/components/text-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { EmptyOrganizationsIllustration } from "@healthalyst/ui/illustrations/empty-organizations-illustration";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
import {
  CLINICAL_RECORD_LIMITS as LIMITS,
  CLINICAL_RECORD_PERMISSIONS,
  NOTE_TYPE_OPTIONS,
} from "~/features/clinical-record/config/clinical-record";
import {
  useNoteTemplates,
  useSaveNoteTemplate,
} from "~/features/clinical-record/hooks/use-clinical-record";
import {
  noteTemplateFormSchema,
  toSectionKey,
  type NoteTemplateFormValues,
} from "~/features/clinical-record/schemas/clinical-record-form-schemas";
import type { NoteTemplate } from "~/features/clinical-record/schemas/clinical-record-response-schemas";
import { describeNoteType } from "~/features/clinical-record/utilities/note-rules";
import { useWorkspace } from "~/shared/workspace/workspace-context";

const EMPTY_TEMPLATE: NoteTemplateFormValues = {
  name: "",
  type: "CONSULTATION",
  sections: [{ label: "", hint: "" }],
  isActive: true,
};

const COLUMNS: readonly DataTableColumn<NoteTemplate>[] = [
  {
    key: "name",
    label: "Template",
    size: "wide",
    getCell: (template) => ({
      kind: "text",
      primary: template.name,
      secondary: template.sections.map((section) => section.label).join(", "),
    }),
  },
  {
    key: "type",
    label: "Note type",
    getCell: (template) => ({
      kind: "text",
      primary: describeNoteType(template.type),
    }),
  },
  {
    key: "status",
    label: "Status",
    size: "compact",
    getCell: (template) =>
      template.builtIn
        ? { kind: "status", label: "Built in", tone: "neutral" }
        : template.isActive
          ? { kind: "status", label: "Offered", tone: "positive" }
          : { kind: "status", label: "Switched off", tone: "neutral" },
  },
];

function TemplateEditor({
  template,
  open,
  onOpenChange,
}: {
  /** Null for a new template. */
  template: NoteTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const saveMutation = useSaveNoteTemplate();
  const form = useForm<NoteTemplateFormValues>({
    resolver: zodResolver(noteTemplateFormSchema),
    defaultValues: EMPTY_TEMPLATE,
  });
  const sections = useFieldArray({ control: form.control, name: "sections" });
  const errors = form.formState.errors;

  useEffect(() => {
    if (!open) return;
    saveMutation.reset();
    form.reset(
      template
        ? {
            name: template.name,
            type: template.type,
            sections: template.sections.map((section) => ({
              label: section.label,
              hint: section.hint ?? "",
            })),
            isActive: template.isActive,
          }
        : EMPTY_TEMPLATE
    );
    // Start again when the editor opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template?.id]);

  const submit = form.handleSubmit((values) =>
    saveMutation.mutate(
      {
        template: template
          ? { id: template.id, version: template.version }
          : null,
        request: {
          name: values.name,
          type: values.type,
          isActive: values.isActive,
          sections: values.sections.map((section) => ({
            key: toSectionKey(section.label),
            label: section.label,
            ...(section.hint && { hint: section.hint }),
          })),
        },
      },
      {
        onSuccess: (savedTemplate) => {
          announceSuccess(`${savedTemplate.name} saved`);
          onOpenChange(false);
        },
      }
    )
  );

  return (
    <DetailSheet
      open={open}
      onOpenChange={onOpenChange}
      title={template ? `Edit ${template.name}` : "Add a note template"}
      description="Clinicians choose a template when they start a note. Each section becomes a box to fill in."
      footer={
        <>
          <ActionButton
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </ActionButton>
          <ActionButton
            type="submit"
            form="note-template-form"
            isLoading={saveMutation.isPending}
            loadingText="Saving"
          >
            {template ? "Save template" : "Add template"}
          </ActionButton>
        </>
      }
    >
      <form
        id="note-template-form"
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(formEvent) => void submit(formEvent)}
      >
        <TextField
          id="note-template-name"
          label="Name"
          required
          placeholder="Diabetes review"
          maxLength={LIMITS.templateName}
          error={errors.name?.message}
          {...form.register("name")}
        />
        <Controller
          control={form.control}
          name="type"
          render={({ field }) => (
            <SelectField
              id="note-template-type"
              label="Note type"
              placeholder="Choose a type"
              options={NOTE_TYPE_OPTIONS}
              value={field.value}
              onValueChange={(value) =>
                field.onChange(value as NoteTemplateFormValues["type"])
              }
            />
          )}
        />
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 text-sm font-medium">Sections</legend>
          {sections.fields.map((section, sectionIndex) => (
            <div
              key={section.id}
              className="flex flex-col gap-3 rounded-lg border border-border p-4"
            >
              <div className="flex items-start gap-2">
                <TextField
                  id={`note-template-section-${sectionIndex}`}
                  label={`Section ${sectionIndex + 1}`}
                  required
                  className="flex-1"
                  placeholder="History"
                  maxLength={LIMITS.sectionLabel}
                  error={errors.sections?.[sectionIndex]?.label?.message}
                  {...form.register(`sections.${sectionIndex}.label`)}
                />
                <ActionButton
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-7"
                  aria-label={`Remove section ${sectionIndex + 1}`}
                  disabled={sections.fields.length === 1}
                  onClick={() => sections.remove(sectionIndex)}
                >
                  <DeleteIcon aria-hidden="true" className="size-4" />
                </ActionButton>
              </div>
              <TextField
                id={`note-template-hint-${sectionIndex}`}
                label="Guidance"
                placeholder="What to write here"
                maxLength={LIMITS.sectionHint}
                error={errors.sections?.[sectionIndex]?.hint?.message}
                {...form.register(`sections.${sectionIndex}.hint`)}
              />
            </div>
          ))}
          {errors.sections?.root?.message && (
            <FormMessage tone="error">
              {errors.sections.root.message}
            </FormMessage>
          )}
          <ActionButton
            type="button"
            variant="outline"
            className="self-start"
            leadingIcon={<AddIcon className="size-4" />}
            disabled={sections.fields.length >= LIMITS.sectionsMaximum}
            onClick={() => sections.append({ label: "", hint: "" })}
          >
            Add a section
          </ActionButton>
        </fieldset>
        {template && (
          <Controller
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <CheckboxField
                id="note-template-active"
                label="Offer this template"
                description="Switched-off templates stay on notes already written."
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        )}
        {saveMutation.isError && (
          <FormMessage tone="error">{saveMutation.error.message}</FormMessage>
        )}
      </form>
    </DetailSheet>
  );
}

/** A template's sections and their guidance, for templates that cannot change. */
function TemplateView({
  template,
  onOpenChange,
}: {
  template: NoteTemplate | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <DetailSheet
      open={template !== null}
      onOpenChange={onOpenChange}
      title={template?.name ?? ""}
      description={
        template
          ? `${describeNoteType(template.type)} notes. Built-in templates cannot be changed.`
          : undefined
      }
    >
      {template && (
        <ol className="flex flex-col gap-4">
          {template.sections.map((section) => (
            <li key={section.key} className="flex flex-col gap-1">
              <p className="font-medium">{section.label}</p>
              {section.hint && (
                <p className="text-sm text-muted-foreground">{section.hint}</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </DetailSheet>
  );
}

/** Built-in note templates and the facility's own. Changes need `schedule:manage`. */
export function NoteTemplatesPage() {
  const { permissions } = useWorkspace();
  const canRead = permissions.includes(CLINICAL_RECORD_PERMISSIONS.readNotes);
  const canManage = permissions.includes(
    CLINICAL_RECORD_PERMISSIONS.manageTemplates
  );
  const templatesQuery = useNoteTemplates(canRead);
  const [editor, setEditor] = useState<{
    template: NoteTemplate | null;
  } | null>(null);
  const [viewedTemplate, setViewedTemplate] = useState<NoteTemplate | null>(
    null
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex max-w-2xl flex-col gap-2">
          <h1 className="font-serif text-title font-normal tracking-tight">
            Note templates
          </h1>
          <p className="text-body text-muted-foreground">
            Templates give clinical notes the same sections every time. The
            built-in ones cannot be changed; add your own for local needs.
          </p>
        </div>
        {canRead && canManage && (
          <ActionButton
            type="button"
            leadingIcon={<AddIcon className="size-4" />}
            onClick={() => setEditor({ template: null })}
          >
            Add a template
          </ActionButton>
        )}
      </div>
      {!canRead ? (
        <StateNotice
          tone="information"
          title="Your role cannot see clinical notes"
        >
          <p>
            Ask an organisation administrator to add the “Read clinical notes,
            addenda and the patient timeline” permission to your role.
          </p>
        </StateNotice>
      ) : (
        <DataTable
          accessibleLabel="Note templates"
          columns={COLUMNS}
          // Ten rows, so every built-in template shows without scrolling.
          maximumVisibleRows={10}
          state={
            templatesQuery.isPending
              ? { status: "loading", label: "Loading templates" }
              : templatesQuery.isError
                ? {
                    status: "error",
                    title: "We could not load the templates",
                    description: templatesQuery.error.message,
                    retryLabel: "Try again",
                    onRetry: () => void templatesQuery.refetch(),
                  }
                : { status: "ready", rows: templatesQuery.data }
          }
          getRowIdentifier={(template) => template.id}
          rowAction={{
            label: (template) =>
              canManage && !template.builtIn
                ? `Edit ${template.name}`
                : `View ${template.name}`,
            onSelect: (template) =>
              canManage && !template.builtIn
                ? setEditor({ template })
                : setViewedTemplate(template),
          }}
          emptyState={{
            illustration: <EmptyOrganizationsIllustration />,
            title: "No templates yet",
          }}
        />
      )}
      <TemplateView
        template={viewedTemplate}
        onOpenChange={(open) => !open && setViewedTemplate(null)}
      />
      {canManage && (
        <TemplateEditor
          template={editor?.template ?? null}
          open={editor !== null}
          onOpenChange={(open) => !open && setEditor(null)}
        />
      )}
    </div>
  );
}
