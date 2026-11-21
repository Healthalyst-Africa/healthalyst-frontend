import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import { CLINICAL_RECORD_ENDPOINTS } from "~/features/clinical-record/config/clinical-record";
import {
  noteTemplateListSchema,
  noteTemplateSchema,
  type NoteTemplate,
  type NoteType,
} from "~/features/clinical-record/schemas/clinical-record-response-schemas";
import { toEntityTag } from "~/features/patients/utilities/patient-presentation";
import { getHealthScheduleHttpClient } from "~/infrastructure/api/health-schedule-http-client";
import { parseHealthScheduleResponse } from "~/shared/api/parse-health-schedule-response";

export type NoteTemplateRequest = {
  name: string;
  type: NoteType;
  sections: { key: string; label: string; hint?: string }[];
  isActive: boolean;
};

const TEMPLATE_FIELD_NAMES = {
  name: "name",
  type: "type",
  sections: "sections",
};

/** Built-in templates, then the facility's own. Requires `note:read`. */
export async function listNoteTemplates(): Promise<NoteTemplate[]> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      CLINICAL_RECORD_ENDPOINTS.noteTemplates
    );
    return parseHealthScheduleResponse(
      noteTemplateListSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load the note templates.");
  }
}

/** Requires `schedule:manage`. */
export async function createNoteTemplate(
  request: NoteTemplateRequest
): Promise<NoteTemplate> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      CLINICAL_RECORD_ENDPOINTS.noteTemplates,
      request
    );
    return parseHealthScheduleResponse(
      noteTemplateSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not add the template.",
      TEMPLATE_FIELD_NAMES
    );
  }
}

/** Replaces a facility template. Requires `schedule:manage`. */
export async function updateNoteTemplate(
  template: Pick<NoteTemplate, "id" | "version">,
  request: NoteTemplateRequest
): Promise<NoteTemplate> {
  try {
    const response = await getHealthScheduleHttpClient().put<unknown>(
      CLINICAL_RECORD_ENDPOINTS.noteTemplate(template.id),
      request,
      { headers: { "If-Match": toEntityTag(template.version) } }
    );
    return parseHealthScheduleResponse(
      noteTemplateSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not save the template.",
      TEMPLATE_FIELD_NAMES
    );
  }
}
