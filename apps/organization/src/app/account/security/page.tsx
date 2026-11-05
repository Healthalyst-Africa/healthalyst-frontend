import type { Metadata } from "next";
import { AccountSecurityPage } from "~/features/account-security/components/account-security-page";
import { readProductsFromQuery } from "~/shared/organization/utilities/read-products-from-query";

export const metadata: Metadata = {
  title: "Account security",
  robots: { index: false, follow: false },
};

/** Account security. Product apps link here with `?product=` to be returned to. */
export default async function AccountSecurityRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { product } = await searchParams;
  return (
    <AccountSecurityPage
      returnProductCode={readProductsFromQuery(product)[0]}
    />
  );
}
