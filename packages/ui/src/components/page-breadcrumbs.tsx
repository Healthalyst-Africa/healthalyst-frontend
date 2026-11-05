import { Fragment, type AnchorHTMLAttributes, type ElementType } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@healthalyst/ui/primitives/breadcrumb";

type BreadcrumbLinkProperties = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

type PageBreadcrumbTrailItem = {
  label: string;
  href: string;
  /** True for another HealthAlyst application, which needs a full page load. */
  isExternal?: boolean;
};

/**
 * Where the current page sits, from the top level down. Earlier pages are
 * links; the current page is named last and is not a link.
 */
export function PageBreadcrumbs({
  trail,
  currentPage,
  linkComponent: LinkComponent = "a",
}: {
  trail: readonly PageBreadcrumbTrailItem[];
  currentPage: string;
  /** The application's router link, such as Next.js `Link`. */
  linkComponent?: ElementType<BreadcrumbLinkProperties>;
}) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {trail.map((item) => (
          <Fragment key={item.href}>
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {item.isExternal ? (
                  <a href={item.href}>{item.label}</a>
                ) : (
                  <LinkComponent href={item.href}>{item.label}</LinkComponent>
                )}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </Fragment>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage className="[overflow-wrap:anywhere]">
            {currentPage}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export type { PageBreadcrumbTrailItem };
