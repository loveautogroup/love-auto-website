/**
 * Features grouped by category for the VDP Features tab.
 *
 * Takes the free-text features array on each vehicle and bucketizes them
 * into Safety / Comfort / Technology / Drivetrain & Performance / Other
 * using keyword pattern matching. Renders each category as a checkmark
 * list with an icon header (matches Maxim Autos VDP convention).
 *
 * Uncategorized features fall into "Other" so nothing is dropped.
 */

interface VDPFeaturesGroupedProps {
  features: string[];
}

interface CategoryDef {
  key: string;
  label: string;
  Icon: () => React.ReactElement;
  /** Keyword patterns (case-insensitive) used to assign features. */
  match: RegExp;
}

const CATEGORIES: CategoryDef[] = [
  {
    key: "safety",
    label: "Safety",
    Icon: SafetyIcon,
    match:
      /\b(airbag|safety|abs|brake|stability|traction|blind\s*spot|lane|lanewatch|collision|adaptive cruise|backup|rearview|camera|park\s*assist|tire pressure|rollover|child)\b/i,
  },
  {
    key: "comfort",
    label: "Comfort",
    Icon: ComfortIcon,
    match:
      /\b(leather|heated|cooled|ventilated|seat|moonroof|sunroof|panoramic|climate|air conditioning|a\/c|power liftgate|power lift|auto-dim|memory)\b/i,
  },
  {
    key: "tech",
    label: "Technology",
    Icon: TechIcon,
    match:
      /\b(navigation|nav|bluetooth|sync|infotainment|touchscreen|sirius|xm|satellite|premium audio|harman|pioneer|bose|jbl|apple|android|carplay|usb|wireless|wi-?fi|onstar|safety connect|hands\s*free|premium sound)\b/i,
  },
  {
    key: "drivetrain",
    label: "Drivetrain & Performance",
    Icon: PerformanceIcon,
    match:
      /\b(awd|all-wheel|4wd|four-wheel|sh-awd|symmetrical|rwd|fwd|turbo|ecoboost|vtec|v6|v8|hp|horsepower|engine|transmission|automatic|manual|paddle|sport|sentronic|selectshift|select\s*shift|exhaust)\b/i,
  },
  {
    key: "convenience",
    label: "Convenience",
    Icon: ConvenienceIcon,
    match:
      /\b(keyless|push button|remote start|start|cruise control|fog|hid|led|headlamp|headlight|daytime|running|wheel|alloy|chrome|roof rack|roof box|tow|trailer|hitch|cargo)\b/i,
  },
];

interface Bucket {
  category: CategoryDef;
  items: string[];
}

function categorize(features: string[]): { buckets: Bucket[]; other: string[] } {
  const buckets: Record<string, string[]> = {};
  const other: string[] = [];

  for (const feature of features) {
    let placed = false;
    for (const category of CATEGORIES) {
      if (category.match.test(feature)) {
        if (!buckets[category.key]) buckets[category.key] = [];
        buckets[category.key].push(feature);
        placed = true;
        break;
      }
    }
    if (!placed) other.push(feature);
  }

  const ordered = CATEGORIES
    .filter((c) => buckets[c.key]?.length)
    .map((c) => ({ category: c, items: buckets[c.key] }));

  return { buckets: ordered, other };
}

export default function VDPFeaturesGrouped({ features }: VDPFeaturesGroupedProps) {
  const { buckets, other } = categorize(features);
  const totalShown = buckets.reduce((n, b) => n + b.items.length, 0) + other.length;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-lg font-bold text-brand-gray-900">
          Features &amp; Specifications
        </h3>
        <span className="text-xs text-brand-gray-500">
          {totalShown} {totalShown === 1 ? "feature" : "features"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {buckets.map(({ category, items }) => (
          <div key={category.key}>
            <div className="flex items-center gap-2 mb-3">
              <div className="text-brand-red">
                <category.Icon />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-brand-gray-700">
                {category.label}
              </h4>
            </div>
            <ul className="space-y-1.5">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-brand-gray-700">
                  <Check />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {other.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="text-brand-red">
                <OtherIcon />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-brand-gray-700">
                Other
              </h4>
            </div>
            <ul className="space-y-1.5">
              {other.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-brand-gray-700">
                  <Check />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-brand-green flex-shrink-0 mt-0.5" aria-hidden="true">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
    </svg>
  );
}

function SafetyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
      <path d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4z" />
    </svg>
  );
}

function ComfortIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
      <path d="M20 9V7c0-2.21-1.79-4-4-4H8C5.79 3 4 4.79 4 7v2c-1.1 0-2 .9-2 2v5c0 1.66 1.34 3 3 3h14c1.66 0 3-1.34 3-3v-5c0-1.1-.9-2-2-2zM10 5h4c.55 0 1 .45 1 1v3h-6V6c0-.55.45-1 1-1zM5 7c0-.55.45-1 1-1h2v3H5V7zm14 11H5c-.55 0-1-.45-1-1v-2h16v2c0 .55-.45 1-1 1z" />
    </svg>
  );
}

function TechIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
      <path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7l-2 3v1h8v-1l-2-3h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z" />
    </svg>
  );
}

function PerformanceIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  );
}

function ConvenienceIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
      <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />
    </svg>
  );
}

function OtherIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
      <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-7 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm4 10H8v-1c0-1.33 2.67-2 4-2s4 .67 4 2v1z" />
    </svg>
  );
}
