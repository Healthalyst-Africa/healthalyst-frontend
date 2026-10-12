import OrganizationRegistrationForm from "~/components/organization-registration-form";
import HealthAlystBrand from "~/components/ui/healthalyst-brand";
import Link from "next/link";

export default function HomePage() {
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
            href="/sign-in"
          >
            Sign in
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-5 md:grid-cols-[0.9fr_1.1fr] md:px-10 md:pt-14">
        <section className="flex flex-col justify-center gap-7 md:pb-16">
          <div className="flex flex-col gap-5">
            <h1 className="max-w-xl font-serif text-4xl leading-tight tracking-tight md:text-5xl">
              Set up your organisation on HealthAlyst.
            </h1>
            <p className="max-w-lg text-base leading-7 text-muted-foreground">
              Register your facility and request access to HealthSchedule. An
              organisation administrator can complete the setup after review.
            </p>
          </div>

          <ol className="flex max-w-lg flex-col gap-5 border-l border-border pl-5">
            <li className="relative flex flex-col gap-1 before:absolute before:-left-[1.58rem] before:top-1 before:size-3 before:rounded-full before:border-2 before:border-primary before:bg-background">
              <span className="text-sm font-semibold">
                Register your facility
              </span>
              <span className="text-sm leading-6 text-muted-foreground">
                Enter organisation details and create the first administrator
                account.
              </span>
            </li>
            <li className="relative flex flex-col gap-1 before:absolute before:-left-[1.58rem] before:top-1 before:size-3 before:rounded-full before:border-2 before:border-border before:bg-background">
              <span className="text-sm font-semibold">
                HealthAlyst reviews the application
              </span>
              <span className="text-sm leading-6 text-muted-foreground">
                Access stays limited while organisation verification is pending.
              </span>
            </li>
            <li className="relative flex flex-col gap-1 before:absolute before:-left-[1.58rem] before:top-1 before:size-3 before:rounded-full before:border-2 before:border-border before:bg-background">
              <span className="text-sm font-semibold">Continue your setup</span>
              <span className="text-sm leading-6 text-muted-foreground">
                Once approved, the administrator can prepare the workspace for
                staff.
              </span>
            </li>
          </ol>

          <p className="max-w-lg border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
            This first release supports HealthSchedule registration. It does not
            request patient records or medical information.
          </p>
        </section>

        <OrganizationRegistrationForm />
      </div>
    </main>
  );
}
