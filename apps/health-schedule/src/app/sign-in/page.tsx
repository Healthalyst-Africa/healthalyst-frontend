import OrganizationStatusLookup from "~/components/organization-status-lookup";
import HealthAlystBrand from "~/components/ui/healthalyst-brand";

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-5 py-12">
      <HealthAlystBrand />
      <OrganizationStatusLookup />
    </main>
  );
}
