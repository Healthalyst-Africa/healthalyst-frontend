import type { PlatformSession } from "@healthalyst/platform-api/authentication-service";
import { Card, CardContent } from "@healthalyst/ui/components/card";

type AuthenticatedApplicationRedirectStateProperties = {
  platformSession: PlatformSession | null;
  isRedirecting: boolean;
  redirectError: string | null;
};

export function AuthenticatedApplicationRedirectState({
  platformSession,
  isRedirecting,
  redirectError,
}: AuthenticatedApplicationRedirectStateProperties) {
  if (redirectError) {
    return (
      <Card className="border-border bg-card shadow-sm" role="alert">
        <CardContent className="flex flex-col gap-2 px-5 py-6 sm:px-6 md:px-8 md:py-8">
          <h2 className="font-semibold">
            We could not open the staff workspace
          </h2>
          <p className="text-sm text-muted-foreground">{redirectError}</p>
        </CardContent>
      </Card>
    );
  }

  if (!isRedirecting) return null;

  const redirectMessage = platformSession?.platformRoles.length
    ? "Opening the HealthAlyst staff workspace…"
    : "Opening your organisation application…";

  return (
    <Card className="border-border bg-card shadow-sm" aria-busy="true">
      <CardContent className="px-5 py-6 sm:px-6 md:px-8 md:py-8">
        <p className="text-sm text-muted-foreground" role="status">
          {redirectMessage}
        </p>
      </CardContent>
    </Card>
  );
}
