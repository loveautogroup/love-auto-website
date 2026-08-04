"use client";

/**
 * Shared breadcrumb used on the VDP, brand/make landing pages, buying
 * guides, and other single-column content pages.
 *
 * "Home" and "Inventory" translate via i18n (t.nav.home / t.nav.inventory).
 * Trailing crumbs (vehicle names, make names, guide titles) are passed in
 * pre-resolved and render as-is — they're proper nouns or DMS/editorial
 * content that stays in English per i18n.ts's documented scope.
 */

import { Fragment } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export interface BreadcrumbCrumb {
  label: string;
  href?: string;
}

export default function SiteBreadcrumb({
  trail,
  includeInventory = false,
}: {
  /** Crumbs after Home (and after Inventory, if includeInventory is set). */
  trail: BreadcrumbCrumb[];
  /** Insert the translated "Inventory" crumb (linked to /inventory) after Home. */
  includeInventory?: boolean;
}) {
  const { t } = useLanguage();
  const items: BreadcrumbCrumb[] = [
    { label: t.nav.home, href: "/" },
    ...(includeInventory ? [{ label: t.nav.inventory, href: "/inventory" }] : []),
    ...trail,
  ];

  return (
    <nav className="max-w-7xl mx-auto px-4 py-4 text-sm" aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-brand-gray-500">
        {items.map((c, i) => {
          const isLast = i === items.length - 1;
          return (
            <Fragment key={i}>
              <li className={isLast ? "text-brand-gray-900 font-medium" : undefined}>
                {c.href && !isLast ? (
                  <Link href={c.href} className="hover:text-brand-red">
                    {c.label}
                  </Link>
                ) : (
                  c.label
                )}
              </li>
              {!isLast && <li>/</li>}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
