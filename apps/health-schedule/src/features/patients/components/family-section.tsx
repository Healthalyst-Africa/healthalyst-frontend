"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { CheckboxField } from "@healthalyst/ui/components/checkbox-field";
import { ChoiceCardGroup } from "@healthalyst/ui/components/choice-card-group";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { FeedbackDialog } from "@healthalyst/ui/components/feedback-dialog";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { FieldLabelText } from "@healthalyst/ui/components/forms/field-label-text";
import { FormSection } from "@healthalyst/ui/components/form-section";
import { LoadingPlaceholder } from "@healthalyst/ui/components/loading-placeholder";
import {
  NoticeBanner,
  StateNotice,
} from "@healthalyst/ui/components/notice-banner";
import { SearchField } from "@healthalyst/ui/components/search-field";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import { TextField } from "@healthalyst/ui/components/text-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { EmptyOrganizationsIllustration } from "@healthalyst/ui/illustrations/empty-organizations-illustration";
import { HEALTH_SCHEDULE_ROUTES } from "~/config/routes";
import {
  PATIENT_FIELD_LIMITS,
  PATIENT_PERMISSIONS,
  RELATIONSHIP_TYPE_LABELS,
  RELATIONSHIP_TYPE_OPTIONS,
} from "~/features/patients/config/patients";
import {
  useRelationshipActions,
  useRelationships,
} from "~/features/patients/hooks/use-patient-record-sections";
import { usePatientSearchResults } from "~/features/patients/hooks/use-patients";
import {
  relationshipFormSchema,
  type RelationshipFormValues,
} from "~/features/patients/schemas/patient-form-schemas";
import type { PatientRelationship } from "~/features/patients/schemas/patient-response-schemas";
import {
  describePatientFacts,
  describePatientFullName,
} from "~/features/patients/utilities/patient-presentation";
import {
  describeRelatedPerson,
  sortRelationships,
} from "~/features/patients/utilities/relationship-presentation";
import { toRelationshipRequest } from "~/features/patients/utilities/patient-requests";
import { applyFieldErrors } from "~/shared/forms/apply-field-errors";
import { focusFirstInvalidField } from "~/shared/forms/focus-first-invalid-field";
import { useDebouncedValue } from "~/shared/hooks/use-debounced-value";
import { useWorkspace } from "~/shared/workspace/workspace-context";

const SEARCH_MINIMUM_LENGTH = 2;
const SEARCH_DELAY_MILLISECONDS = 300;

/** Family, guardians and next of kin, with who may consent for the patient. */
export function FamilySection({ patientId }: { patientId: string }) {
  const { permissions } = useWorkspace();
  const canEdit = permissions.includes(PATIENT_PERMISSIONS.update);
  const relationshipsQuery = useRelationships(patientId);
  const actions = useRelationshipActions(patientId);
  const [isAdding, setIsAdding] = useState(false);
  const [endingRelationship, setEndingRelationship] =
    useState<PatientRelationship | null>(null);

  const relationships = sortRelationships(relationshipsQuery.data ?? []);

  return (
    <ContentPanel
      heading="Family and contacts"
      headingLevel={2}
      description="A guardian may give consent for the patient. Emergency contacts are called first if something goes wrong."
      headingAccessory={
        canEdit && (
          <ActionButton
            type="button"
            variant="outline"
            size="small"
            leadingIcon={<AddIcon className="size-4" />}
            onClick={() => {
              actions.add.reset();
              setIsAdding(true);
            }}
          >
            Add a person
          </ActionButton>
        )
      }
    >
      {relationshipsQuery.isPending ? (
        <LoadingPlaceholder
          label="Loading family and contacts"
          rows={[{ shape: "card" }, { shape: "card" }]}
        />
      ) : relationshipsQuery.isError ? (
        <StateNotice
          tone="error"
          title="We could not load family and contacts"
          action={
            <ActionButton
              type="button"
              variant="outline"
              onClick={() => void relationshipsQuery.refetch()}
            >
              Try again
            </ActionButton>
          }
        >
          <p>{relationshipsQuery.error.message}</p>
        </StateNotice>
      ) : relationships.length === 0 ? (
        <StateNotice
          tone="information"
          title="Nobody linked yet"
          illustration={<EmptyOrganizationsIllustration />}
        >
          <p>
            {canEdit
              ? "Add a parent, guardian or next of kin, especially for children and older patients."
              : "Family members and contacts added for this patient will appear here."}
          </p>
        </StateNotice>
      ) : (
        <ul className="flex flex-col gap-3">
          {relationships.map((relationship) => (
            <RelationshipItem
              key={relationship.id}
              relationship={relationship}
              canEnd={canEdit && !relationship.inverse}
              onEnd={() => {
                actions.end.reset();
                setEndingRelationship(relationship);
              }}
            />
          ))}
        </ul>
      )}
      {canEdit && (
        <>
          <AddRelationshipDialog
            patientId={patientId}
            open={isAdding}
            onOpenChange={setIsAdding}
            mutation={actions.add}
          />
          <FeedbackDialog
            open={endingRelationship !== null}
            onOpenChange={(open) => {
              if (!open) setEndingRelationship(null);
            }}
            tone="warning"
            title={
              endingRelationship
                ? `Remove ${describeRelatedPerson(endingRelationship)}?`
                : "Remove this person?"
            }
            description={
              actions.end.isError
                ? actions.end.error.message
                : "They will no longer show on this record, or be able to consent for the patient. The link stays in the history."
            }
            primaryAction={{
              label: "Remove",
              isLoading: actions.end.isPending,
              loadingText: "Removing",
              onSelect: () => {
                if (!endingRelationship) return;
                actions.end.mutate(endingRelationship.id, {
                  onSuccess: () => {
                    announceSuccess(
                      `${describeRelatedPerson(endingRelationship)} removed`
                    );
                    setEndingRelationship(null);
                  },
                });
              },
            }}
            secondaryAction={{
              label: "Keep",
              onSelect: () => setEndingRelationship(null),
            }}
          />
        </>
      )}
    </ContentPanel>
  );
}

function RelationshipItem({
  relationship,
  canEnd,
  onEnd,
}: {
  relationship: PatientRelationship;
  canEnd: boolean;
  onEnd: () => void;
}) {
  const relatedPatient = relationship.relatedPatient;
  const name = describeRelatedPerson(relationship);
  return (
    <li className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2 font-medium">
          {relatedPatient ? (
            <Link
              href={HEALTH_SCHEDULE_ROUTES.patient(relatedPatient.id)}
              className="text-primary underline-offset-4 hover:underline"
            >
              {name}
            </Link>
          ) : (
            name
          )}
          {relationship.isGuardian && (
            <StatusLabel tone="highlight">Guardian</StatusLabel>
          )}
          {relationship.isEmergencyContact && (
            <StatusLabel tone="information">Emergency contact</StatusLabel>
          )}
        </span>
        <span className="text-caption text-muted-foreground">
          {[
            RELATIONSHIP_TYPE_LABELS[relationship.type] ?? "Related",
            relatedPatient
              ? `patient ${relatedPatient.patientNumber}`
              : "not a patient here",
            relationship.contact?.phone,
            relationship.inverse ? "recorded on their record" : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </div>
      {canEnd && (
        <ActionButton
          type="button"
          variant="outline"
          size="small"
          onClick={onEnd}
        >
          Remove
          <span className="sr-only">{` ${name}`}</span>
        </ActionButton>
      )}
    </li>
  );
}

const EMPTY_RELATIONSHIP: RelationshipFormValues = {
  linkTo: "patient",
  type: "",
  relatedPatientId: "",
  relatedPatientName: "",
  contactName: "",
  contactPhone: "",
  isGuardian: false,
  isEmergencyContact: false,
};

const LINK_OPTIONS = [
  {
    value: "patient",
    label: "A patient here",
    description:
      "Find their record, such as a mother registered at this facility.",
  },
  {
    value: "contact",
    label: "Someone else",
    description: "Record a name and phone number only.",
  },
] as const;

function AddRelationshipDialog({
  patientId,
  open,
  onOpenChange,
  mutation,
}: {
  patientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mutation: ReturnType<typeof useRelationshipActions>["add"];
}) {
  const form = useForm<RelationshipFormValues>({
    resolver: zodResolver(relationshipFormSchema),
    defaultValues: EMPTY_RELATIONSHIP,
    shouldFocusError: false,
  });
  const errors = form.formState.errors;
  const linkTo = form.watch("linkTo");
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebouncedValue(
    searchText.trim(),
    SEARCH_DELAY_MILLISECONDS
  );
  const isSearching =
    open &&
    linkTo === "patient" &&
    debouncedSearchText.length >= SEARCH_MINIMUM_LENGTH;
  const searchQuery = usePatientSearchResults(debouncedSearchText, isSearching);
  const searchResults = (searchQuery.data ?? []).filter(
    (patient) => patient.id !== patientId
  );

  useEffect(() => {
    if (open) {
      form.reset(EMPTY_RELATIONSHIP);
      setSearchText("");
    }
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = form.handleSubmit(
    (values) =>
      mutation.mutate(toRelationshipRequest(values), {
        onSuccess: () => {
          announceSuccess(
            `${values.linkTo === "patient" ? values.relatedPatientName : values.contactName.trim()} added`
          );
          onOpenChange(false);
        },
        onError: (error) =>
          applyFieldErrors(error, form.setError, [
            "type",
            "relatedPatientId",
            "contactName",
            "contactPhone",
          ]),
      }),
    (invalidFields) =>
      focusFirstInvalidField(invalidFields, {
        type: "relationship-type",
        relatedPatientId: "relationship-patient-search",
        contactName: "relationship-contact-name",
        contactPhone: "relationship-contact-phone",
      })
  );

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      size="wide"
      title="Add a family member or contact"
      submitLabel="Add person"
      submittingLabel="Adding"
      isSubmitting={mutation.isPending}
      error={
        mutation.isError && Object.keys(errors).length === 0
          ? mutation.error.message
          : undefined
      }
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      <Controller
        control={form.control}
        name="linkTo"
        render={({ field }) => (
          <ChoiceCardGroup
            id="relationship-link-to"
            legend="Who is it?"
            required
            options={LINK_OPTIONS}
            value={field.value}
            onValueChange={(value) => {
              field.onChange(value);
              form.clearErrors();
            }}
          />
        )}
      />
      {linkTo === "patient" ? (
        <div className="flex flex-col gap-3">
          <label
            htmlFor="relationship-patient-search"
            className="text-sm font-medium"
          >
            <FieldLabelText label="Find the patient" required />
          </label>
          <SearchField
            id="relationship-patient-search"
            value={searchText}
            onChange={(changeEvent) => setSearchText(changeEvent.target.value)}
            placeholder="Name, phone, patient or folder number"
            aria-required="true"
            aria-invalid={Boolean(errors.relatedPatientId)}
            aria-describedby={
              errors.relatedPatientId ? "relationship-patient-error" : undefined
            }
            autoComplete="off"
          />
          {errors.relatedPatientId && (
            <p
              id="relationship-patient-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.relatedPatientId.message}
            </p>
          )}
          {isSearching && searchQuery.isPending && (
            <p role="status" className="text-sm text-muted-foreground">
              Searching
            </p>
          )}
          {searchQuery.isError && (
            <NoticeBanner tone="error" title="The search did not work">
              {searchQuery.error.message}
            </NoticeBanner>
          )}
          {isSearching &&
            searchQuery.isSuccess &&
            searchResults.length === 0 && (
              <p role="status" className="text-sm text-muted-foreground">
                No other patient matches “{debouncedSearchText}”. Check the
                spelling, or add them as someone else.
              </p>
            )}
          {searchResults.length > 0 && (
            <Controller
              control={form.control}
              name="relatedPatientId"
              render={({ field }) => (
                <ChoiceCardGroup
                  id="relationship-patient"
                  legend="Matching patients"
                  layout="stack"
                  options={searchResults.slice(0, 5).map((patient) => ({
                    value: patient.id,
                    label: describePatientFullName(patient),
                    description: describePatientFacts(patient).join(" · "),
                  }))}
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    const chosenPatient = searchResults.find(
                      (patient) => patient.id === value
                    );
                    form.setValue(
                      "relatedPatientName",
                      chosenPatient
                        ? describePatientFullName(chosenPatient)
                        : ""
                    );
                    form.clearErrors("relatedPatientId");
                  }}
                />
              )}
            />
          )}
        </div>
      ) : (
        <FormSection title="Contact">
          <TextField
            id="relationship-contact-name"
            label="Full name"
            required
            autoComplete="off"
            maxLength={PATIENT_FIELD_LIMITS.name}
            error={errors.contactName?.message}
            {...form.register("contactName")}
          />
          <TextField
            id="relationship-contact-phone"
            label="Phone number"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            description="Such as 0803 123 4567."
            error={errors.contactPhone?.message}
            {...form.register("contactPhone")}
          />
        </FormSection>
      )}
      <FormSection title="Relationship">
        <Controller
          control={form.control}
          name="type"
          render={({ field }) => (
            <SelectField
              id="relationship-type"
              label="They are the patient's"
              required
              placeholder="Choose"
              options={RELATIONSHIP_TYPE_OPTIONS}
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
                // A guardian can consent for the patient; others can be
                // marked as one too.
                if (value === "GUARDIAN") form.setValue("isGuardian", true);
              }}
              error={errors.type?.message}
            />
          )}
        />
        <div className="flex flex-col gap-3 sm:pt-7">
          <Controller
            control={form.control}
            name="isGuardian"
            render={({ field }) => (
              <CheckboxField
                id="relationship-guardian"
                label="Guardian"
                description="May act and give consent for the patient."
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Controller
            control={form.control}
            name="isEmergencyContact"
            render={({ field }) => (
              <CheckboxField
                id="relationship-emergency"
                label="Emergency contact"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
      </FormSection>
    </FormDialog>
  );
}
