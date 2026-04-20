# DMS Schema Handoff — Merchandising Fields

**From:** Charlotte (webdev) + Bob (graphics) + Jordan (sales)
**To:** Bill (software engineer), when custom DMS work begins
**Date:** April 20, 2026
**Status:** Forward-looking spec. No code change needed today. Read this before you design the DMS vehicle schema.

## Why this exists

Jordan now has a working merchandising overlay system on the public website (`/admin/merchandising`), backed by Cloudflare KV. It controls per-vehicle featuring, status badges, Carfax visibility, feature pill copy, warranty overrides, and "hide from site" flags.

That's temporary plumbing. When Bill's custom DMS replaces Dealer Center as the source of truth for vehicle data, these merchandising controls need to migrate INTO the DMS rather than stay in KV as a separate system. Two reasons:

1. **One UI, not two.** Jordan shouldn't juggle "DMS for inventory, KV admin for merchandising." Merchandising becomes a set of fields on the vehicle record in the DMS, editable right from the vehicle detail screen.
2. **No stale references.** When a vehicle is sold or archived in the DMS, its merchandising entries should disappear automatically. Foreign key cascade, not a cleanup script.

Read this doc when you're designing the DMS vehicle schema. Bake these fields in from day one.

## Current merchandising model (what's live today)

Stored in Cloudflare KV as `config:v1`, edited via `/admin/merchandising`. Schema lives in `src/data/merchandising.ts` and `functions/_lib/validation.ts`.

```ts
interface MerchandisingConfig {
  featuredVins: string[];              // ordered; position = display order on homepage & inventory grid
  defaultWarranty: string;             // site-wide default, e.g. "30-Day Warranty"
  overlays: Record<VIN, VehicleOverlay>; // per-vehicle customizations
}

interface VehicleOverlay {
  status?: "just-arrived" | "price-reduced" | "price-drop"
         | "staff-pick" | "low-mileage" | "sale-pending";
  carfax?: boolean;
  featurePills?: [string?, string?, string?]; // each up to 40 chars, single \n allowed
  warrantyOverride?: string;          // up to 80 chars
  hidden?: boolean;                   // filter from public site
}
```

Validation enforced server-side:
- VINs must match `^[A-HJ-NPR-Z0-9]{17}$`
- Max 12 featured VINs
- Pill text max 40 chars, warranty max 80 chars
- Display text rejects `<`, `>`, `"`, control chars (Sam's defense-in-depth)

## Proposed DMS schema

PostgreSQL syntax. Adjust to whatever ORM Bill picks (Prisma, SQLAlchemy, Drizzle, etc.).

### `dealership_merchandising` (1 row per dealership)

Site-wide defaults that apply unless overridden per vehicle.

```sql
CREATE TABLE dealership_merchandising (
  dealership_id     UUID PRIMARY KEY REFERENCES dealerships(id) ON DELETE CASCADE,
  default_warranty  TEXT NOT NULL DEFAULT '30-Day Warranty'
                       CHECK (char_length(default_warranty) <= 80),
  updated_by        TEXT NOT NULL,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

For single-location LAG, there's exactly one row. Keeping it as a table (not a hardcoded constant) makes multi-location expansion trivial later.

### `vehicle_merchandising` (1 row per vehicle, optional)

Per-vehicle overrides.

```sql
CREATE TYPE merch_status AS ENUM (
  'just-arrived', 'price-reduced', 'price-drop',
  'staff-pick', 'low-mileage', 'sale-pending'
);

CREATE TABLE vehicle_merchandising (
  vehicle_id         UUID PRIMARY KEY REFERENCES vehicles(id) ON DELETE CASCADE,
  featured_order     INT NULL CHECK (featured_order IS NULL OR featured_order >= 0),
  status_badge       merch_status NULL,
  carfax_available   BOOLEAN NOT NULL DEFAULT FALSE,
  feature_pill_1     TEXT NULL CHECK (feature_pill_1 IS NULL OR char_length(feature_pill_1) <= 40),
  feature_pill_2     TEXT NULL CHECK (feature_pill_2 IS NULL OR char_length(feature_pill_2) <= 40),
  feature_pill_3     TEXT NULL CHECK (feature_pill_3 IS NULL OR char_length(feature_pill_3) <= 40),
  warranty_override  TEXT NULL CHECK (warranty_override IS NULL OR char_length(warranty_override) <= 80),
  hidden_from_site   BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by         TEXT NOT NULL,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Efficient queries for the public site
CREATE INDEX ix_vmerch_featured
  ON vehicle_merchandising (featured_order)
  WHERE featured_order IS NOT NULL AND hidden_from_site = FALSE;

CREATE INDEX ix_vmerch_hidden
  ON vehicle_merchandising (hidden_from_site)
  WHERE hidden_from_site = TRUE;

-- Optional audit trail table — log every merchandising edit for easy rollback
CREATE TABLE vehicle_merchandising_history (
  id                BIGSERIAL PRIMARY KEY,
  vehicle_id        UUID NOT NULL,
  snapshot          JSONB NOT NULL,        -- whole row as of this change
  updated_by        TEXT NOT NULL,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_vmerch_hist_vehicle ON vehicle_merchandising_history(vehicle_id, updated_at DESC);
```

**Design choices + rationale:**

- **Separate `vehicle_merchandising` table, not columns on `vehicles`**
  - Keeps the core vehicle record clean (VIN, specs, cost, status — structured domain data)
  - Nulls for non-merchandised vehicles live in a sidecar table instead of polluting the main one
  - `ON DELETE CASCADE` means when a vehicle is archived/deleted, its merchandising row goes too — no zombie references
  - Can grant different RBAC on merchandising (Jordan writes, Sales reads) vs the vehicle record (Jeremiah + Bill)

- **`featured_order` as INT, not a separate ordering table**
  - Jordan picks 3-6 heroes at a time, so gap reordering is fine
  - Nullable — most vehicles aren't featured
  - Partial index only covers non-null, hidden=false → fast SELECT for the homepage

- **Three columns for `feature_pill_1/2/3`, not JSONB**
  - Max three pills by design. Fixed shape.
  - Simpler queries, simpler checks, simpler forms in the admin UI
  - JSONB would be overengineering here

- **Enum for `status_badge`, not free text**
  - Badge kinds are fixed (matches `StatusBadgeKind` in TypeScript)
  - Prevents typos that'd break the renderer

- **`hidden_from_site` as first-class boolean**
  - Common case — pull an ugly-photo'd vehicle off the site while it's being re-shot without deleting the DMS record

### Ingestion / migration from current KV store

When Bill wires the DMS into the live website, migrate Jordan's current KV config into the new schema:

```python
# Pseudocode — run once during cutover
kv_config = cloudflare_kv.get("config:v1")

# 1. Upsert dealership-level config
db.dealership_merchandising.upsert({
    "dealership_id": LAG_DEALERSHIP_ID,
    "default_warranty": kv_config["defaultWarranty"],
    "updated_by": "migration",
})

# 2. Materialize featured order from the array position
for i, vin in enumerate(kv_config["featuredVins"]):
    vehicle = db.vehicles.find_by_vin(vin)
    if not vehicle:
        continue  # vehicle was sold before migration — skip
    db.vehicle_merchandising.upsert({
        "vehicle_id": vehicle.id,
        "featured_order": i,
        "updated_by": "migration",
    })

# 3. Per-vehicle overlays
for vin, overlay in kv_config["overlays"].items():
    vehicle = db.vehicles.find_by_vin(vin)
    if not vehicle:
        continue
    db.vehicle_merchandising.upsert({
        "vehicle_id": vehicle.id,
        "status_badge": overlay.get("status"),
        "carfax_available": overlay.get("carfax", False),
        "feature_pill_1": overlay.get("featurePills", [None, None, None])[0],
        "feature_pill_2": overlay.get("featurePills", [None, None, None])[1],
        "feature_pill_3": overlay.get("featurePills", [None, None, None])[2],
        "warranty_override": overlay.get("warrantyOverride"),
        "hidden_from_site": overlay.get("hidden", False),
        "updated_by": "migration",
    })
```

After migration, retire the KV namespace and the `/admin/merchandising` Cloudflare Pages Function admin — Jordan now edits merchandising from inside the DMS.

## API contract the DMS needs to expose

Charlotte's website needs one endpoint to populate vehicle cards. Add merchandising fields to the existing vehicle API response:

```typescript
GET /api/vehicles?active=true
// Response (array, pre-sorted featured-first then newest):
[
  {
    // Core vehicle fields
    id: "uuid",
    vin: "5FNYF6H9XGB041495",
    year: 2016, make: "Honda", model: "Pilot", trim: "Touring",
    price: 10999, mileage: 164623,
    // ... rest of standard vehicle fields

    // Merchandising overlay (null if the vehicle has no customizations)
    merchandising: {
      featuredOrder: 0,          // null or 0-indexed position
      statusBadge: "staff-pick", // null or enum
      carfaxAvailable: true,
      featurePills: ["Third-Row\nSeating", "Adaptive\nCruise", "Heated\nLeather"],
      warrantyOverride: null,    // null → use dealership default
      hiddenFromSite: false,
      updatedBy: "jordan@loveautogroup.com",
      updatedAt: "2026-04-20T18:00:00Z"
    }
  },
  // ... more vehicles
]
```

Dealership default warranty comes from `GET /api/dealership` or is hardcoded on the client (it rarely changes).

**Server-side ordering logic (SQL-ish):**

```sql
SELECT v.*, vm.*
FROM vehicles v
LEFT JOIN vehicle_merchandising vm ON vm.vehicle_id = v.id
WHERE v.status = 'available'
  AND COALESCE(vm.hidden_from_site, FALSE) = FALSE
ORDER BY
  vm.featured_order NULLS LAST,  -- Jordan's picks first, in order
  v.listed_at DESC;              -- Then newest
```

The public website consumes this list as-is. No client-side merchandising computation needed anymore — the server has already applied Jordan's rules.

## Admin UI in the DMS

When you build the vehicle detail page in the DMS, add a "Merchandising" tab or section:

- Featured toggle + position input (auto-incremented when added; drag-reorderable in a "Featured Vehicles" list view)
- Status badge dropdown (7 options including "— none —")
- Carfax available checkbox
- Three feature-pill text inputs (40 char each, `\n` allowed)
- Warranty override input (80 char)
- Hide-from-site checkbox
- Audit trail at the bottom: "Last updated by X at Y"

The functional requirements are already proven in `MerchandisingAdmin.tsx`. Port the UX; reuse the validation rules.

## Keep these invariants when you rebuild

Learned during Phase 1–3 implementation. Preserve:

1. **VIN is the natural key for merchandising in the current config**, but in the DMS it's `vehicle_id` (UUID) since VINs can be typo'd and UUIDs can't.
2. **Feature pills allow ONE `\n`** — enables two-line pills like "Symmetrical\nAWD". Enforced in Sam's validator. Maintain that.
3. **Display text rejects `<`, `>`, `"` and ASCII control chars.** Same reasoning as before — defense in depth so future consumers can't be XSS'd.
4. **Audit fields are server-stamped from the authenticated session, not client-supplied.** Clients can't forge `updated_by`.
5. **`hidden_from_site` is a separate flag from `status = "sold"` or `status = "archived"`.** Jordan hides an available vehicle temporarily (bad photos, disputed pricing). Different lifecycle from archiving.
6. **Max 12 featured vehicles** (current limit in Sam's validator). Not strictly necessary but prevents accidental "feature everything" that dilutes the hero slot.

## Open questions for when you start DMS work

1. **Multi-tenant from day one?** If LAG might ever become two locations, design the vehicle and merchandising tables with `dealership_id` now. If never, skip it.
2. **Soft delete on vehicles?** If vehicles are soft-deleted (archived, not destroyed), decide whether `ON DELETE CASCADE` on merchandising is the right call or if merchandising should persist for audit.
3. **Who writes merchandising?** Current answer: Jordan only. If Bob or Mark also need edit access (e.g. Bob updates carfax flags after photography), add RBAC for roles-in-dealership (sales, marketing, admin).
4. **Rebuild or live fetch?** Currently the KV config is fetched client-side; the DMS version could either stay client-fetched (fresh, ~60s cache) or be baked into the static build with an on-save deploy hook. Pick based on update frequency at that point.

## Files to reference during DMS work

- `src/data/merchandising.ts` — current TypeScript schema and helpers (`filterFeatured`, `sortWithFeaturedFirst`, `resolveOverlay`)
- `functions/_lib/validation.ts` — server-side validator, transferable logic
- `functions/api/admin/merchandising.ts` — admin API handler shape
- `src/app/admin/merchandising/MerchandisingAdmin.tsx` — admin UI UX reference
- `docs/security-audit-merchandising-admin.md` — Sam's findings that shaped the current design

Build this right the first time in the DMS and the cutover is invisible to Jordan — same mental model, same fields, better database.
