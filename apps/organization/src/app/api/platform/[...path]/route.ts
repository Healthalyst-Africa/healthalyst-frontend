import { handlePlatformBackendForFrontendRequest } from "@healthalyst/platform-api/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlatformRouteContext = {
  params: Promise<{ path: string[] }>;
};

const routeConfiguration = {
  application: "organization",
  localOrigin: "http://localhost:5173",
  sessionCookieName: "__Host-healthalyst-organization-session",
  challengeCookieName: "__Secure-healthalyst-organization-auth-challenge",
} as const;

async function handleRequest(
  request: Request,
  context: PlatformRouteContext
): Promise<Response> {
  return handlePlatformBackendForFrontendRequest(
    request,
    context.params,
    routeConfiguration
  );
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PATCH = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
