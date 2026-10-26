import { SignIn } from "~/features/authentication";
import { readProductsFromQuery } from "~/shared/organization/utilities/read-products-from-query";

/** Sign-in. Product apps link here with `?product=` to be opened afterwards. */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { product } = await searchParams;
  return <SignIn requestedProductCodes={readProductsFromQuery(product)} />;
}
