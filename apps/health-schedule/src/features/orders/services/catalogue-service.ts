import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import { ORDER_ENDPOINTS } from "~/features/orders/config/orders";
import {
  orderableServiceSchema,
  orderCatalogueSchema,
  type OrderableService,
} from "~/features/orders/schemas/order-response-schemas";
import { toEntityTag } from "~/features/patients/utilities/patient-presentation";
import { getHealthScheduleHttpClient } from "~/infrastructure/api/health-schedule-http-client";
import { parseHealthScheduleResponse } from "~/shared/api/parse-health-schedule-response";

/**
 * The tests and scans this facility offers. Switched-off ones only when
 * asked for. Requires `patient:read`.
 */
export async function listCatalogue(
  includeInactive: boolean
): Promise<OrderableService[]> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      ORDER_ENDPOINTS.catalogue,
      { params: includeInactive ? { includeInactive: "true" } : {} }
    );
    return parseHealthScheduleResponse(
      orderCatalogueSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load the tests and scans.");
  }
}

/**
 * Adds the backend's starter tests and scans that are not in the catalogue
 * yet. The laboratory sets reference ranges later. Requires
 * `schedule:manage`.
 */
export async function addStarterCatalogue(): Promise<OrderableService[]> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      ORDER_ENDPOINTS.starterCatalogue,
      {}
    );
    return parseHealthScheduleResponse(
      orderCatalogueSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not add the starter tests.");
  }
}

/**
 * Switches a test or scan on or off for new orders. The API takes the whole
 * entry, so everything else is sent back unchanged with the version it was
 * read at. Requires `schedule:manage`.
 */
export async function setCatalogueItemActive(
  service: OrderableService,
  isActive: boolean
): Promise<OrderableService> {
  try {
    const response = await getHealthScheduleHttpClient().put<unknown>(
      ORDER_ENDPOINTS.catalogueItem(service.id),
      {
        code: service.code,
        name: service.name,
        kind: service.kind,
        departmentId: service.departmentId,
        specimen: service.specimen,
        fields: service.fields,
        turnaroundHours: service.turnaroundHours,
        isActive,
      },
      { headers: { "If-Match": toEntityTag(service.version) } }
    );
    return parseHealthScheduleResponse(
      orderableServiceSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(
      error,
      isActive
        ? "We could not switch the test on."
        : "We could not switch the test off."
    );
  }
}
