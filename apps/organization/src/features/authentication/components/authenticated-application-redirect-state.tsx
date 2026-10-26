import { BrandLoader } from "@healthalyst/ui/components/brand-loader";
import { BRAND_MARK_SOURCE } from "~/config/brand";
import { StatusPanel } from "@healthalyst/ui/components/status-panel";

type AuthenticatedApplicationRedirectStateProperties = {
  isRedirecting: boolean;
  redirectError: string | null;
  redirectMessage: string;
};

export function AuthenticatedApplicationRedirectState({
  isRedirecting,
  redirectError,
  redirectMessage,
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

  return (
    <BrandLoader
      markSource={BRAND_MARK_SOURCE}
      label={redirectMessage}
      presentation="inline"
    />
  );
}
