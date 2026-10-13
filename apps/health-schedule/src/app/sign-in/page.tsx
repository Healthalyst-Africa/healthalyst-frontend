import { OrganizationStatusLookup } from "~/features/organization-onboarding";
import HealthAlystBrand from "~/components/ui/healthalyst-brand";
import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 md:px-10">
        <HealthAlystBrand />
        <div className="flex items-center gap-5">
          <p className="hidden text-sm text-muted-foreground sm:block">
            Organisation onboarding
          </p>
          <Link
            className="text-sm font-semibold text-primary underline underline-offset-4"
            href="/"
          >
            Register your facility
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-5 md:min-h-[calc(100dvh-7rem)] md:grid-cols-[0.9fr_1.1fr] md:items-center md:px-10 md:pb-10 md:pt-10">
        <section className="flex flex-col justify-center gap-7">
          <div className="flex flex-col gap-5">
            <h1 className="max-w-xl font-serif text-4xl leading-tight tracking-tight md:text-5xl">
              Follow your organisation’s application.
            </h1>
            <p className="max-w-lg text-base leading-7 text-muted-foreground">
              Sign in with the administrator account created during registration
              to see your application status and any review note.
            </p>
          </div>

          <ol className="flex max-w-lg flex-col gap-5 border-l border-border pl-5">
            <li className="relative flex flex-col gap-1 before:absolute before:-left-[1.58rem] before:top-1 before:size-3 before:rounded-full before:border-2 before:border-primary before:bg-background">
              <span className="text-sm font-semibold">Sign in</span>
              <span className="text-sm leading-6 text-muted-foreground">
                Use the work email address and password from registration.
              </span>
            </li>
            <li className="relative flex flex-col gap-1 before:absolute before:-left-[1.58rem] before:top-1 before:size-3 before:rounded-full before:border-2 before:border-border before:bg-background">
              <span className="text-sm font-semibold">
                Check the review status
              </span>
              <span className="text-sm leading-6 text-muted-foreground">
                See whether your application is pending, approved, needs
                changes, or was not approved.
              </span>
            </li>
            <li className="relative flex flex-col gap-1 before:absolute before:-left-[1.58rem] before:top-1 before:size-3 before:rounded-full before:border-2 before:border-border before:bg-background">
              <span className="text-sm font-semibold">
                Read any review note
              </span>
              <span className="text-sm leading-6 text-muted-foreground">
                If HealthAlyst leaves a note, it appears with your application
                status.
              </span>
            </li>
          </ol>

          <p className="max-w-lg border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
            HealthSchedule access depends on organisation approval. This page
            shows the application status linked to your administrator account.
          </p>
        </section>

        <OrganizationStatusLookup />
      </div>
    </main>
  );
}
