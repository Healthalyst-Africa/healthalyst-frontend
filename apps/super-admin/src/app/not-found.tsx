import Image from "next/image";
import Link from "next/link";
import { NotFoundPage } from "@healthalyst/ui/components/not-found-page";

export default function NotFound() {
  return (
    <NotFoundPage
      brand={
        <Image
          src="/logo.jpg"
          alt="HealthAlyst Africa"
          width={1024}
          height={1023}
          sizes="56px"
          className="size-14 object-contain"
        />
      }
      action={<Link href="/dashboard">Go to the dashboard</Link>}
    />
  );
}
