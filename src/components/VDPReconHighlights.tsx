/**
 * Ivan's Recon Highlights — inspection checklist for the VDP.
 *
 * Static component: every Love Auto vehicle goes through Ivan's full
 * multi-point reconditioning before it hits the lot. This makes that
 * process visible to the customer as a trust signal. It doesn't require
 * per-vehicle API data — the process is identical for every car.
 *
 * Placement: below VDPMarketPriceWrap, above VDPTabs in the right
 * column of the VDP layout.
 */

const CHECKLIST_ITEMS = [
  "Multi-point mechanical inspection",
  "Oil & fluids serviced",
  "Tire tread & pressure verified",
  "Brakes inspected front & rear",
  "Battery tested & charged",
  "All exterior lights confirmed",
  "A/C & heat tested",
  "Interior fully detailed & cleaned",
  "All electronics & features verified",
];

export default function VDPReconHighlights() {
  return (
    <section
      className="bg-white rounded-xl border border-brand-gray-200 p-5"
      aria-labelledby="recon-heading"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="shrink-0 mt-0.5 w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <h2
            id="recon-heading"
            className="text-sm font-bold text-brand-gray-900 uppercase tracking-wide"
          >
            Ivan&rsquo;s Recon Checklist
          </h2>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Every car inspected &amp; reconditioned before it leaves our lot
          </p>
        </div>
      </div>

      {/* Checklist grid — 2 columns on wider screens */}
      <ul
        className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2"
        role="list"
      >
        {CHECKLIST_ITEMS.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-brand-gray-700">
            <svg
              className="shrink-0 w-4 h-4 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            {item}
          </li>
        ))}
      </ul>

      {/* Footer note */}
      <p className="mt-4 text-[11px] text-brand-gray-400 leading-snug">
        Ivan is our in-house reconditioning specialist. Every vehicle is inspected and
        approved before we list it. Not happy with something? We&rsquo;ll fix it before you drive off.
      </p>
    </section>
  );
}
