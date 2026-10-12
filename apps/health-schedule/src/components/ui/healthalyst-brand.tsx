import Image from "next/image";
import Link from "next/link";

export default function HealthAlystBrand() {
  return (
    <Link
      className="flex w-fit items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      href="/"
      aria-label="HealthAlyst Africa home"
    >
      <Image
        alt=""
        className="size-16 object-contain"
        height={1023}
        sizes="64px"
        src="/logo.jpg"
        width={1024}
      />
    </Link>
  );
}
