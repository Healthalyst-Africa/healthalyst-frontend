import { QueryClient } from "@tanstack/react-query";
import { APPLICATION_QUERY_DEFAULTS } from "~/infrastructure/query/query-configuration";
export function createApplicationQueryClient() {
  return new QueryClient({ defaultOptions: APPLICATION_QUERY_DEFAULTS });
}
