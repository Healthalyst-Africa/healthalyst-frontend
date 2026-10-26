import { BrandLoader } from "@healthalyst/ui/components/brand-loader";
import { BRAND_MARK_SOURCE } from "~/config/brand";

export default function Loading() {
  return <BrandLoader markSource={BRAND_MARK_SOURCE} />;
}
