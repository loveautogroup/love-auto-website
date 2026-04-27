/**
 * Market price indicator displayed on the VDP.
 *
 * Compares the asking price to a market estimate (Jordan-researched, stored
 * in the merchandising overlay) and renders a CarGurus-style verdict + a
 * green-yellow-red gradient bar with a marker showing where the asking
 * price sits relative to market.
 *
 * Rating thresholds (relative to estimate):
 *   Great Deal:    < 92%
 *   Good Deal:     < 97%
 *   Fair Price:    97% – 103%
 *   Above Market:  > 103%
 *
 * If marketEstimate isn't set on the vehicle, this component renders nothing.
 * That's intentional — Jordan chooses which vehicles get the comparison
 * (we don't want a synthetic estimate to mislead anyone).
 */

interface VDPMarketPriceProps {
  askingPrice: number;
  marketEstimate?: number;
}

type PriceRating = "great" | "good" | "fair" | "above";

interface RatingInfo {
  label: string;
  description: string;
  className: string;
  /** Position 0-100 along the gradient bar where the marker should sit. */
  markerPercent: number;
}

function ratingFor(askingPrice: number, marketEstimate: number): RatingInfo {
  const ratio = askingPrice / marketEstimate;
  const savings = marketEstimate - askingPrice;
  const savingsAbs = Math.abs(savings);
  const savingsHasCents = Math.round(savingsAbs * 100) % 100 !== 0;
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: savingsHasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(savingsAbs);

  // Map ratio to marker position. We want 70% of estimate = 0% of bar (far left
  // = great deal), 130% of estimate = 100% of bar (far right = above market).
  // That gives a 60-percentage-point range that clamps nicely.
  const markerPercent = Math.max(
    2,
    Math.min(98, ((ratio - 0.7) / 0.6) * 100)
  );

  let kind: PriceRating;
  let label: string;
  let description: string;

  if (ratio < 0.92) {
    kind = "great";
    label = "Great Deal";
    description = `${formatted} below market`;
  } else if (ratio < 0.97) {
    kind = "good";
    label = "Good Deal";
    description = `${formatted} below market`;
  } else if (ratio <= 1.03) {
    kind = "fair";
    label = "Fair Price";
    description = "Right around market value";
  } else {
    kind = "above";
    label = "Above Market";
    description = `${formatted} above market`;
  }

  // Color & icon vary by rating
  const classNames: Record<PriceRating, string> = {
    great: "bg-green-100 text-green-800 border-green-200",
    good: "bg-emerald-50 text-emerald-700 border-emerald-200",
    fair: "bg-amber-50 text-amber-700 border-amber-200",
    above: "bg-red-50 text-red-700 border-red-200",
  };

  return {
    label,
    description,
    className: classNames[kind],
    markerPercent,
  };
}

export default function VDPMarketPrice({
  askingPrice,
  marketEstimate,
}: VDPMarketPriceProps) {
  if (!marketEstimate || marketEstimate <= 0) return null;

  const rating = ratingFor(askingPrice, marketEstimate);
  const askingHasCents = Math.round(askingPrice * 100) % 100 !== 0;
  const formattedAsking = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: askingHasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(askingPrice);
  const estimateHasCents = Math.round(marketEstimate * 100) % 100 !== 0;
  const formattedEstimate = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: estimateHasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(marketEstimate);

  return (
    <section
      className="bg-white rounded-xl border border-brand-gray-200 p-5"
      aria-labelledby="market-price-heading"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2
            id="market-price-heading"
            className="text-sm font-bold text-brand-gray-900 uppercase tracking-wide"
          >
            Market Price Analysis
          </h2>
          <p className="text-xs text-brand-gray-500 mt-0.5">
            Independent estimate based on comparable Chicago-area listings
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${rating.className}`}
        >
          {rating.label}
        </span>
      </div>

      {/* Asking vs Estimate row */}
      <div className="flex items-baseline justify-between mb-2 text-sm">
        <div>
          <span className="text-brand-gray-500">Asking</span>{" "}
          <span className="font-bold text-brand-gray-900">{formattedAsking}</span>
        </div>
        <div>
          <span className="text-brand-gray-500">Market Estimate</span>{" "}
          <span className="font-bold text-brand-gray-900">{formattedEstimate}</span>
        </div>
      </div>

      {/* Gradient bar with marker */}
      <div className="relative h-2.5 rounded-full overflow-hidden bg-gradient-to-r from-green-500 via-yellow-400 to-red-500">
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${rating.markerPercent}%` }}
        >
          <div className="w-4 h-4 bg-white border-2 border-brand-gray-900 rounded-full shadow-md" />
        </div>
      </div>

      <div className="flex justify-between text-[10px] font-medium text-brand-gray-500 mt-1.5 uppercase tracking-wide">
        <span>Great Deal</span>
        <span>Fair Price</span>
        <span>Above Market</span>
      </div>

      <p className="text-xs text-brand-gray-600 mt-3 text-center">
        {rating.description}
      </p>
    </section>
  );
}
