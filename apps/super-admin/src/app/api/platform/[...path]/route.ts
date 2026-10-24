import { handlePlatformBackendForFrontendRequest } from "@healthalyst/platform-api/server";

import { PLATFORM_ROUTE_CONFIGURATION } from "~/infrastructure/platform/server-configuration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlatformRouteContext = {
  params: Promise<{ path: string[] }>;
};

async function handleRequest(
  request: Request,
  context: PlatformRouteContext
): Promise<Response> {
  return handlePlatformBackendForFrontendRequest(
    request,
    context.params,
    PLATFORM_ROUTE_CONFIGURATION
  );
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PATCH = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
