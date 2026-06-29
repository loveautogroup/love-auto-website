/**
 * GA4 loader — Love Auto Group (loveautogroup.net).
 *
 * Measurement ID is hardcoded (not read from NEXT_PUBLIC_*). On this
 * Cloudflare Pages output:export pipeline, NEXT_PUBLIC_* vars compile to
 * runtime process.env reads that are EMPTY in the browser (the same gotcha
 * that silently broke the lead-intake key, S27) — so an env-driven loader
 * never fires. A GA4 measurement ID is public, so hardcoding is safe.
 * Stream ID 14553927993. Env override kept for local/dev only. Plain
 * <script> tags (not next/script) to match the CF beacon + CarGurus snippet
 * already in layout.tsx.
 *
 * Swap the ID below if GA4 Admin (under loveautogroup@gmail.com) shows a
 * different Measurement ID for the loveautogroup.net web stream.
 */

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-1LHF81EF2G";

export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;
  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: true });
`,
        }}
      />
    </>
  );
}
