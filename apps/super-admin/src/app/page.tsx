import { redirect } from "next/navigation";

import { APPLICATION_ROUTES } from "~/config/application-routes";

export default function HomePage() {
  redirect(APPLICATION_ROUTES.dashboard);
}
