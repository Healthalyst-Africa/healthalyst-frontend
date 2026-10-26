import { permanentRedirect } from "next/navigation";
import { ORGANIZATION_ROUTES } from "~/config/routes";

export default function ApplicationRoute() {
  permanentRedirect(ORGANIZATION_ROUTES.onboarding);
}
