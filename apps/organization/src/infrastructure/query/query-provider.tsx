"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createApplicationQueryClient } from "~/infrastructure/query/query-client";

let browserQueryClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    return createApplicationQueryClient();
  }

  browserQueryClient ??= createApplicationQueryClient();
  return browserQueryClient;
}

export function ApplicationQueryProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}
