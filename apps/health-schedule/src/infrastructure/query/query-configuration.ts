import type { DefaultOptions } from "@tanstack/react-query";
export const APPLICATION_QUERY_DEFAULTS = {
  queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: false },
  mutations: { retry: false, gcTime: 0 },
} satisfies DefaultOptions;
