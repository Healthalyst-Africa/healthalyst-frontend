import type { Metadata } from "next";
import { ProductLauncherPage } from "~/features/product-launcher/components/product-launcher-page";

export const metadata: Metadata = {
  title: "Choose a product | HealthAlyst",
  robots: { index: false, follow: false },
};

export default function ProductsRoute() {
  return <ProductLauncherPage />;
}
