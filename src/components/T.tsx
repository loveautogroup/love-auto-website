"use client";

/**
 * Generic inline-translation helper for server components.
 *
 * Server components (VDP page, brand/make landing pages, etc.) can't call
 * useLanguage() directly. For a one-off string that doesn't warrant its own
 * named client component, drop this in instead:
 *
 *   <T get={(t) => t.ctas.getPreApproved} />
 *
 * For strings that need interpolation, do the replace in the getter:
 *
 *   <T get={(t) => t.vdpChrome.call} />{" "}{SITE_CONFIG.phone}
 *
 * Prefer a dedicated named client component (see VDPTextUsLink, VDPTrustStrip,
 * etc.) when the same text needs several call sites or non-trivial markup —
 * this is for single-use inline swaps only.
 */

import { useLanguage } from "@/context/LanguageContext";
import type { Translations } from "@/lib/i18n";

export default function T({ get }: { get: (t: Translations) => string }) {
  const { t } = useLanguage();
  return <>{get(t)}</>;
}
