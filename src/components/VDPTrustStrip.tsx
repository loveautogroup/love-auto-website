/**
 * Trust strip — displayed on the VDP, homepage, and inventory page.
 *
 * Three credibility pillars for Love Auto Group:
 *   1. Fully Inspected · Free CARFAX Included
 *   2. Japanese Makes Specialist · Over a Decade in Villa Park
 *   3. No Hidden Fees · All Credit Welcome · Same-Day Title & Plates
 */

export default function VDPTrustStrip() {
  return (
    <section
      aria-label="Love Auto Group trust pillars"
      className="
        bg-gradient-to-r from-brand-red to-brand-red-dark text-white
        rounded-xl shadow-sm
        mb-4
      "
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">

          <span className="inline-flex items-center gap-2">
            <Shield />
            <span>
              <strong className="font-bold">Fully Inspected</strong>
              <span className="hidden md:inline text-white/80"> · Free CARFAX Included</span>
            </span>
          </span>

          <span className="hidden md:inline-block w-px h-5 bg-white/30" aria-hidden="true" />

          <span className="inline-flex items-center gap-2">
            <WrenchIcon />
            <span>
              <strong className="font-bold">Japanese Makes Specialist</strong>
              <span className="hidden md:inline text-white/80"> · Over a Decade in Villa Park</span>
            </span>
          </span>

          <span className="hidden md:inline-block w-px h-5 bg-white/30" aria-hidden="true" />

          <span className="inline-flex items-center gap-2">
            <DollarIcon />
            <span>
              <strong className="font-bold">No Hidden Fees</strong>
              <span className="hidden md:inline text-white/80"> · All Credit Welcome · Same-Day Title &amp; Plates</span>
            </span>
          </span>

        </div>
      </div>
    </section>
  );
}

function Shield() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0" aria-hidden="true">
      <path d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4zm-1 14l-4-4 1.4-1.4L11 13.2l5.6-5.6L18 9l-7 7z" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0" aria-hidden="true">
      <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
    </svg>
  );
}
