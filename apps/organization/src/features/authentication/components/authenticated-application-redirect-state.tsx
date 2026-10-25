import type { PlatformSession } from "@healthalyst/platform-api/authentication-service";
import { StatusPanel } from "@healthalyst/ui/components/status-panel";

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
      <StatusPanel
        tone="error"
        title="We could not open the staff workspace"
        message={redirectError}
      />
    );
  }

  if (!isRedirecting) return null;

  const redirectMessage = platformSession?.platformRoles.length
    ? "Opening the HealthAlyst staff workspace…"
    : "Opening your organisation application…";

  return <StatusPanel tone="loading" message={redirectMessage} />;
}
