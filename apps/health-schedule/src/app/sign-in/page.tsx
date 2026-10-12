import OrganizationStatusLookup from "~/components/organization-status-lookup";

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-5 py-12">
      <a className="flex w-fit items-center gap-3" href="/">
        <span className="flex size-10 items-center justify-center rounded-full bg-primary font-serif text-lg font-semibold text-primary-foreground">
          H
        </span>
        <span className="font-serif text-xl font-semibold tracking-tight">
          HealthAlyst
        </span>
      </a>
      <OrganizationStatusLookup />
    </main>
  );
}
