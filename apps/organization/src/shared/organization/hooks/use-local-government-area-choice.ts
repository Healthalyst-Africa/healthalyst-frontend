"use client";

import { useQuery } from "@tanstack/react-query";
import type { FormOption } from "@healthalyst/ui/types/form-definition";
import {
  LOCAL_GOVERNMENT_AREA_CONFIGURATION,
  LOCAL_GOVERNMENT_AREA_FIELD_TEXT,
} from "~/shared/organization/config/local-government-areas";
import { nigerianStateOptions } from "~/shared/organization/config/organization-reference";
import { getLocalGovernmentAreas } from "~/shared/organization/services/local-government-area-service";

export type LocalGovernmentAreaChoice = {
  options: FormOption[];
  placeholder: string;
  /** No state is chosen yet, or its areas are still loading. */
  unavailable: boolean;
  /** Set when the areas could not be loaded. */
  loadError: string | undefined;
  isRetrying: boolean;
  retry: () => void;
};

function isKnownStateCode(stateCode: string): boolean {
  return nigerianStateOptions.some((option) => option.value === stateCode);
}

/**
 * The local government areas (LGAs) to offer for the chosen state. The API
 * only accepts one of the state's own areas, so the list follows the state.
 *
 * `savedArea` keeps an area saved before the official list existed: it stays
 * selectable in its own state, so editing other details never loses it.
 */
export function useLocalGovernmentAreaChoice({
  stateCode,
  savedArea,
}: {
  stateCode: string;
  savedArea?: { stateCode: string; localGovernmentArea: string };
}): LocalGovernmentAreaChoice {
  const hasState = isKnownStateCode(stateCode);
  const areasQuery = useQuery({
    queryKey: [
      LOCAL_GOVERNMENT_AREA_CONFIGURATION.queryNamespace,
      "local-government-areas",
      stateCode,
    ],
    queryFn: () => getLocalGovernmentAreas(stateCode),
    enabled: hasState,
    staleTime: LOCAL_GOVERNMENT_AREA_CONFIGURATION.staleTimeMilliseconds,
    retry: LOCAL_GOVERNMENT_AREA_CONFIGURATION.retryCount,
  });

  const areas = areasQuery.data ?? [];
  const options: FormOption[] = areas.map((area) => ({
    value: area,
    label: area,
  }));
  const keptArea =
    savedArea?.localGovernmentArea && savedArea.stateCode === stateCode
      ? savedArea.localGovernmentArea
      : undefined;
  if (keptArea && !areas.includes(keptArea)) {
    options.unshift({ value: keptArea, label: keptArea });
  }

  const retry = () => void areasQuery.refetch();
  if (!hasState) {
    return {
      options,
      placeholder: LOCAL_GOVERNMENT_AREA_FIELD_TEXT.chooseStateFirst,
      unavailable: true,
      loadError: undefined,
      isRetrying: false,
      retry,
    };
  }
  if (areasQuery.isError) {
    return {
      options,
      placeholder: LOCAL_GOVERNMENT_AREA_FIELD_TEXT.choose,
      unavailable: options.length === 0,
      loadError: LOCAL_GOVERNMENT_AREA_FIELD_TEXT.loadFailed,
      isRetrying: areasQuery.isFetching,
      retry,
    };
  }
  return {
    options,
    placeholder: areasQuery.isPending
      ? LOCAL_GOVERNMENT_AREA_FIELD_TEXT.loading
      : LOCAL_GOVERNMENT_AREA_FIELD_TEXT.choose,
    unavailable: areasQuery.isPending,
    loadError: undefined,
    isRetrying: false,
    retry,
  };
}
