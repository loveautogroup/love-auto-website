/**
 * Mark-authored content for make-specific SEO landing pages.
 *
 * Each entry powers a `/inventory/used-{slug}` route that targets queries
 * like "used Subaru Villa Park IL" / "used Lexus DuPage County". These
 * pages reinforce Love Auto Group's Japanese-specialist positioning and
 * are the single biggest organic-traffic opportunity per the SEO audit.
 *
 * Content guidelines (Mark):
 *   - Target one primary local keyword in the H1 ("Used Subaru in Villa Park, IL")
 *   - Body copy ~600-800 words, split into 4-6 H2 sections
 *   - Include local geography (Villa Park, DuPage County, Chicago suburbs,
 *     adjacent towns like Lombard/Elmhurst/Oak Brook) at least 3x
 *   - End with a CTA back to live inventory filtered by make
 */

export interface MakeLandingContent {
  /** URL slug — final URL is /inventory/used-{slug} */
  slug: string;
  /** Display name for H1 + breadcrumb */
  make: string;
  /** Title tag, ≤60 chars */
  title: string;
  /** Meta description, ~155 chars */
  description: string;
  /** Hero subhead beneath the H1 */
  hero: string;
  /** Primary 2-3 sentence intro that appears before sections */
  intro: string;
  /** H2 sections, each with 1-3 paragraphs of body copy */
  sections: { heading: string; body: string[] }[];
  /** 3-5 model highlights for a callout grid */
  models: { name: string; pitch: string }[];
  /**
   * Filter type for live inventory section. Defaults to filtering by `make`
   * field, matching against `make` (case-insensitive). Body-style landings
   * filter against `vehicle.bodyStyle` instead.
   */
  filterType?: "make" | "bodyStyle";
  /** Value to match in the chosen filter field, if different from `make`. */
  filterValue?: string;
  /** Plural noun used in copy ("Subarus", "SUVs", "sedans") */
  pluralNoun?: string;
}

export const MAKE_LANDINGS: MakeLandingContent[] = [
  // ─── SUBARU ──────────────────────────────────────────────────────────
  {
    slug: "subaru",
    make: "Subaru",
    title: "Used Subaru for Sale in Villa Park, IL | Love Auto Group",
    description:
      "Quality used Subaru sedans, SUVs, and crossovers in Villa Park, IL. Inspected, reconditioned, free Carfax. Family owned since 2014, serving DuPage County.",
    hero:
      "Symmetrical AWD, legendary reliability, and Chicago-winter-ready performance — every used Subaru on our lot.",
    intro:
      "If you're looking for a used Subaru in Villa Park, IL or anywhere in DuPage County, you're in the right place. Love Auto Group has been a Japanese-vehicle specialist since 2014, and Subaru's reputation for symmetrical all-wheel drive, boxer-engine durability, and four-season versatility is exactly the kind of vehicle our buyers come looking for. Whether you need an Outback to handle Lake Geneva ski runs, a Forester for the daily commute on I-290, or a Crosstrek that makes school drop-off feel like an adventure, we keep our Subaru inventory carefully curated.",
    sections: [
      {
        heading: "Why a Used Subaru Makes Sense in the Chicago Suburbs",
        body: [
          "Subaru's standard symmetrical all-wheel drive is genuinely different from the AWD systems most other manufacturers retrofit onto front-wheel-drive platforms. The boxer engine sits low and centered, weight distributes evenly across all four wheels, and the result is the kind of confident handling Chicago-area drivers actually need from December through March. We've watched customers trade up from RWD coupes after one bad winter on Roosevelt Road, and Subaru is consistently the brand they land on.",
          "Beyond winter performance, the Subaru ownership experience is built around longevity. The boxer engine layout is mechanically simple, the AWD transfer case has fewer common failure points than competing systems, and the Symmetrical AWD nameplate is a real engineering claim — not marketing. We see Subarus regularly cross 200,000 miles with their original drivetrains intact.",
        ],
      },
      {
        heading: "Models We Specialize In",
        body: [
          "Our Villa Park lot rotates through Subaru's most popular nameplates. The Outback is our most-requested midsize wagon — it's the right answer for buyers who want SUV ground clearance without the size penalty. The Forester is the best-value compact SUV in the segment for under $15,000 used. The Crosstrek hits a sweet spot for younger buyers and downsizers who want AWD without compromising on fuel economy. And when we can find a clean Legacy sedan in the lower price tier, they don't sit long.",
        ],
      },
      {
        heading: "What Buying a Used Subaru From Love Auto Group Looks Like",
        body: [
          "Every used Subaru on our lot goes through a multi-point mechanical inspection before it's listed. CVT health, head gasket condition (a known wear item on certain model years), AWD coupling fluid, and timing chain tensioner are all checked specifically because they're the items Subaru owners actually need to know about. We share full Carfax reports for free on every vehicle, and we'll talk through any service history flags openly before you sign anything.",
          "We're a Carfax Advantage Dealer, which means our reporting compliance is verified by Carfax and you can pull a free vehicle history report directly from any Subaru listing on our site.",
        ],
      },
      {
        heading: "Serving Villa Park, Lombard, Elmhurst, and the Western Suburbs",
        body: [
          "We're located at 735 N Yale Ave, Villa Park, IL 60181 — easy to reach from Lombard, Elmhurst, Oak Brook, Glen Ellyn, Addison, and the rest of DuPage County. Customers regularly drive in from Naperville, Wheaton, and the I-290 / I-294 corridor for our Japanese-vehicle specialization. Browse the current Subaru inventory below or stop by during our extended afternoon hours.",
        ],
      },
    ],
    models: [
      { name: "Outback", pitch: "Wagon SUV with the most ground clearance per dollar in its class." },
      { name: "Forester", pitch: "Best-value AWD compact SUV under $15K used." },
      { name: "Crosstrek", pitch: "Compact crossover with real AWD and 30+ MPG highway." },
      { name: "Legacy", pitch: "Midsize sedan with standard AWD — rare in this segment." },
      { name: "Impreza", pitch: "Affordable AWD compact car. Hatchback or sedan." },
    ],
  },

  // ─── LEXUS ───────────────────────────────────────────────────────────
  {
    slug: "lexus",
    make: "Lexus",
    title: "Used Lexus for Sale in Villa Park, IL | Love Auto Group",
    description:
      "Pre-owned Lexus sedans, SUVs, and coupes in Villa Park, IL. Inspected, reconditioned, free Carfax. Japanese-vehicle specialists serving DuPage County since 2014.",
    hero:
      "Toyota reliability with the materials and refinement of a German luxury car — at half the depreciation curve.",
    intro:
      "A used Lexus is one of the smartest luxury-car purchases in the market, and Love Auto Group is one of the few independent dealerships in Villa Park, IL that consistently keeps Lexus inventory on the lot. The reason is simple: Lexus shares its drivetrains, electronics, and assembly engineering with Toyota, but its first owners pay a luxury premium that drops out of the price the moment the car hits the secondary market. That's the buyer opportunity, and we've been quietly capitalizing on it for our DuPage County customers since 2014.",
    sections: [
      {
        heading: "The Lexus Value Argument",
        body: [
          "Pick a used 2016-2018 Lexus RC, ES, or RX and run it against a used BMW 3-Series, Audi A4, or Mercedes C-Class of the same year and mileage. Two things become obvious. First, the Lexus is reliably $3,000-$8,000 cheaper. Second, the projected ownership cost over the next five years is dramatically lower because the Lexus is built on Toyota mechanical bones. Same engines, same transmissions, same proven electronics — just better materials, better sound insulation, and a quieter cabin.",
          "We see this play out in our showroom regularly. A buyer comes in shopping a German luxury car, takes a Lexus on a test drive 'just to compare,' and changes their mind by the time they're back at the lot. That's not us upselling — it's the cars doing the work.",
        ],
      },
      {
        heading: "Models We See Most Often",
        body: [
          "The RX is our highest-demand Lexus by a wide margin. It's a midsize luxury SUV with proven hybrid options, real third-row availability on the L variant, and the kind of resale pricing that makes sense to a Villa Park family upgrading from a Highlander or a Pilot. The ES is the sedan equivalent — quiet, comfortable, surprisingly efficient on the I-290 commute, and built on the Toyota Avalon platform that runs forever. The IS and RC give us our enthusiast buyers — the IS sedan as a more refined alternative to a 3-Series, the RC coupe as a personal luxury car that still surprises people on the test drive.",
        ],
      },
      {
        heading: "What Inspection Looks Like on a Used Lexus",
        body: [
          "Lexus vehicles share Toyota's reputation for needing very little non-routine work, but used examples still benefit from a careful pre-sale check. We verify hybrid battery state-of-health on hybrid models (the single most expensive component on a used hybrid Lexus, and the one most worth knowing about), inspect the transmission cooler lines on the RX, check the air-suspension components on the LX and GX, and pull a full Carfax report on every car so you can see service history and accident records yourself.",
          "If a Lexus comes through with anything we wouldn't drive ourselves, it doesn't get listed. The ones we do list are ones we'd recommend to family.",
        ],
      },
      {
        heading: "Serving Villa Park, Oak Brook, Naperville, and the Western Suburbs",
        body: [
          "Our Villa Park, IL location at 735 N Yale Ave puts us within a 15-minute drive of Oak Brook, Lombard, Elmhurst, Hinsdale, and the rest of DuPage County's luxury-car-shopping market. We're one of the few independent Japanese-vehicle specialists in the area, which means our Lexus inventory is hand-picked rather than whatever the franchise-dealer auctions had to dump. Browse the live inventory below or call us to ask about a specific model — we source to order when we don't have what you want in stock.",
        ],
      },
    ],
    models: [
      { name: "RX", pitch: "Midsize luxury SUV. Hybrid options. Family-buyer favorite." },
      { name: "ES", pitch: "Comfortable luxury sedan on the bulletproof Toyota Avalon platform." },
      { name: "IS", pitch: "Sport luxury sedan with RWD and AWD options." },
      { name: "RC", pitch: "Personal luxury coupe with real V6 power. Distinctive styling." },
      { name: "GX", pitch: "Body-on-frame luxury SUV. Toyota 4Runner mechanicals." },
    ],
  },

  // ─── ACURA ──────────────────────────────────────────────────────────
  {
    slug: "acura",
    make: "Acura",
    title: "Used Acura for Sale in Villa Park, IL | Love Auto Group",
    description:
      "Used Acura SUVs, sedans, and coupes in Villa Park, IL. Honda reliability, luxury features, free Carfax. Family owned, serving DuPage County since 2014.",
    hero:
      "Honda reliability, near-luxury features, and the SH-AWD system — at independent-dealer prices.",
    intro:
      "Acura is the smart-money luxury brand. Built on Honda mechanicals, refined with extra sound insulation and premium interior materials, and consistently priced below European competitors on the used market. If you're looking for a used Acura in Villa Park, IL or anywhere in DuPage County, Love Auto Group is one of the few independent dealerships specializing in Japanese vehicles that actively curates Acura inventory. We've been doing this since 2014.",
    sections: [
      {
        heading: "Why Used Acura Makes Sense",
        body: [
          "Acura's value proposition is straightforward: you're buying Honda's drivetrain reliability with luxury-car materials and tech for thousands less than a German competitor. The MDX shares its V6 with the Honda Pilot. The TLX shares its platform with the Accord. The RDX shares its 2.0L turbo with the Civic Type R. The mechanical DNA is proven, the parts are inexpensive, and the resale curve has done most of the depreciation work for the second owner.",
          "We see this on the test drive constantly. Buyers come in expecting a downgrade from a BMW or Audi and end up surprised by how composed and quiet an Acura actually is — especially the MDX with SH-AWD on Chicago-suburb roads.",
        ],
      },
      {
        heading: "The SH-AWD Difference",
        body: [
          "Super Handling All-Wheel Drive is Acura's torque-vectoring AWD system, and it's genuinely excellent. Unlike basic AWD setups that just split torque front-to-rear, SH-AWD can shift power between individual rear wheels, which makes the car feel more confident in corners and more stable on slippery roads. For Chicago-area buyers driving I-290 and I-355 in winter, it's a meaningful upgrade over open-differential AWD systems.",
          "We carry SH-AWD-equipped MDXes regularly, and they're some of our highest-value listings for buyers who want luxury, third-row capability, and AWD that actually works.",
        ],
      },
      {
        heading: "Models We Stock",
        body: [
          "MDX is the headline product — three-row luxury SUV with Honda Pilot bones and Acura interior treatment. RDX gives us our compact luxury crossover buyers. TLX is the midsize sport sedan, increasingly popular with buyers stepping out of TL leases. TSX wagon and ILX show up occasionally and don't last long. Whatever model you're looking for, our inventory rotates regularly — call ahead if there's something specific you want us to keep an eye out for at auction.",
        ],
      },
      {
        heading: "Serving Villa Park, Elmhurst, Lombard, and the Chicago Suburbs",
        body: [
          "Love Auto Group is at 735 N Yale Ave in Villa Park, IL — close to Elmhurst, Lombard, Oak Brook, and the rest of DuPage County. We're a Carfax Advantage Dealer, family-owned since 2014, and one of the few independent dealers in the area that genuinely specializes in Japanese vehicles rather than carrying whatever the auctions had on hand. Browse the live Acura inventory below.",
        ],
      },
    ],
    models: [
      { name: "MDX", pitch: "Three-row luxury SUV with SH-AWD and Honda Pilot reliability." },
      { name: "RDX", pitch: "Compact luxury crossover with the Civic Type R turbo engine." },
      { name: "TLX", pitch: "Midsize sport sedan. Honda Accord platform with luxury polish." },
      { name: "TSX", pitch: "European-flavored sport sedan. Wagon variant a cult favorite." },
      { name: "ILX", pitch: "Entry luxury sedan on the Civic platform." },
    ],
  },

  // ─── MAZDA ──────────────────────────────────────────────────────────
  {
    slug: "mazda",
    make: "Mazda",
    title: "Used Mazda for Sale in Villa Park, IL | Love Auto Group",
    description:
      "Quality used Mazda3, CX-5, CX-30, and Miata in Villa Park, IL. Driver-focused engineering, free Carfax. Family owned, serving DuPage County since 2014.",
    hero:
      "The brand that puts driving feel ahead of marketing budgets — and prices its used inventory accordingly.",
    intro:
      "Mazda is the underrated player in the Japanese-vehicle market. The brand consistently builds cars that drivers genuinely enjoy — sharp steering, well-judged suspension tuning, premium interior materials at mainstream prices — and yet they depreciate at competitive rates. That's the buyer opportunity we work with at Love Auto Group, and Mazda has been a quiet specialty of ours since we opened in Villa Park, IL in 2014.",
    sections: [
      {
        heading: "Why Mazda Stands Out in the Used Market",
        body: [
          "The cleanest comparison: a 2018 Mazda CX-5 vs a 2018 Honda CR-V or Toyota RAV4 of the same trim and mileage. The Mazda is usually $1,000-$2,500 cheaper, and on the test drive it's the most engaging of the three by a wide margin — better steering feel, more cohesive suspension, a more refined interior. Mazda's marketing budget is smaller than its competitors', which keeps used pricing honest, but the engineering is competitive with anything in the segment.",
          "Same story plays out in the Mazda3 vs Civic vs Corolla comparison. Same story in the CX-30 vs HR-V vs C-HR. If driving feel matters to you and you're buying used, Mazda is consistently the right answer.",
        ],
      },
      {
        heading: "Models We Carry",
        body: [
          "CX-5 is our most-requested Mazda — compact luxury-feeling SUV at mainstream pricing. CX-30 has been gaining momentum as the smaller alternative. Mazda3 sedan and hatchback are popular with first-time luxury buyers and downsizers. CX-9 fills the three-row need. And when we can find a clean MX-5 Miata, it's gone within a week — that's a niche enthusiast purchase but a fun one.",
        ],
      },
      {
        heading: "Inspection and Reconditioning",
        body: [
          "Every used Mazda on our lot is inspected for the items that matter on the platform: SkyActiv engine carbon-buildup signs (a known long-term wear pattern on direct-injection turbo engines), AWD transfer case fluid on CX-5 and CX-9 models, infotainment system functionality, and full Carfax history. As a Carfax Advantage Dealer, we provide a free Carfax report on every vehicle and won't list anything we wouldn't drive ourselves.",
        ],
      },
      {
        heading: "Visit Us in Villa Park",
        body: [
          "We're at 735 N Yale Ave, Villa Park, IL 60181, easy to get to from Lombard, Elmhurst, Oak Brook, Glen Ellyn, Addison, and the broader DuPage County area. Our hours run afternoons-into-evenings most days so working professionals can stop by after the I-290 commute. Browse current Mazda inventory below or call ahead to ask about a specific model.",
        ],
      },
    ],
    models: [
      { name: "CX-5", pitch: "Compact SUV with the most driver-focused tuning in its class." },
      { name: "CX-30", pitch: "Subcompact crossover that drives bigger than it looks." },
      { name: "Mazda3", pitch: "Sedan or hatchback. Premium interior at compact-car pricing." },
      { name: "CX-9", pitch: "Three-row SUV with surprisingly engaging dynamics." },
      { name: "MX-5 Miata", pitch: "The lightweight roadster that defined the segment." },
    ],
  },

  // ─── HONDA ──────────────────────────────────────────────────────────
  {
    slug: "honda",
    make: "Honda",
    title: "Used Honda for Sale in Villa Park, IL | Love Auto Group",
    description:
      "Used Honda Civic, Accord, CR-V, Pilot, and Odyssey in Villa Park, IL. Free Carfax, family owned since 2014, serving Lombard, Elmhurst, and DuPage County.",
    hero:
      "The benchmark for reliability, fuel economy, and resale value — at independent-dealer pricing.",
    intro:
      "Honda is the brand that built the modern Japanese-vehicle reputation in the U.S. market — bulletproof drivetrains, exceptional fuel economy, the strongest resale value curve in the segment, and the kind of repair costs that make Honda ownership pay for itself over time. Love Auto Group has been a Honda specialist since opening in Villa Park, IL in 2014, and Civic, Accord, CR-V, Pilot, and Odyssey are constants on our lot.",
    sections: [
      {
        heading: "Why Honda Holds Value",
        body: [
          "Resale value is a leading indicator of long-term reliability, and Honda is consistently at the top of every used-car retention ranking. The Civic and Accord both regularly run 200,000-300,000 miles on original drivetrains. The CR-V is the benchmark compact SUV for total cost of ownership. The Odyssey minivan is the answer for families who want sliding doors without German repair bills. And the Pilot is a credible three-row SUV at a price the competition can't touch.",
          "What this means for a used buyer: a 7-year-old Honda with 100,000 miles is not a tired car. It's typically halfway through its useful life. That's the math that makes our Honda inventory disappear quickly.",
        ],
      },
      {
        heading: "What's on the Lot",
        body: [
          "Civic and Accord sedan inventory rotates fastest — they're the highest-demand commuter cars in DuPage County, and we move them quickly when we can find clean low-mileage examples at auction. CR-V is the highest-margin SUV in our segment because it sells itself. Pilot Touring with third-row seating and adaptive cruise is our family-buyer favorite. Odyssey shows up regularly for the Lombard / Elmhurst / Oak Brook family market that's outgrown a CR-V.",
        ],
      },
      {
        heading: "Inspection Standards",
        body: [
          "Honda's reliability reputation is real but not unconditional. We inspect every used Honda for the platform-specific items: CVT health and fluid condition (especially on Civic and CR-V), VTC actuator function (Civic L15B7 turbo engines), AC compressor on early Pilot model years, and full transmission service records when available. As a Carfax Advantage Dealer, we provide a free Carfax report on every Honda we list.",
        ],
      },
      {
        heading: "Easy to Reach From the Western Suburbs",
        body: [
          "Our Villa Park location at 735 N Yale Ave is a 5-15 minute drive from Lombard, Elmhurst, Oak Brook, Glen Ellyn, Addison, and the rest of DuPage County. We're family-owned, Japanese-specialty since 2014, and one of the few independent dealers in the area where you can browse Honda inventory without the franchise-dealer markup. Browse the current selection below.",
        ],
      },
    ],
    models: [
      { name: "Civic", pitch: "The benchmark compact car. Sedan, hatchback, coupe variants." },
      { name: "Accord", pitch: "Midsize sedan with the strongest resale value in its class." },
      { name: "CR-V", pitch: "Compact SUV. Best total-cost-of-ownership in the segment." },
      { name: "Pilot", pitch: "Three-row SUV with real space and Honda's drivetrain bones." },
      { name: "Odyssey", pitch: "Family minivan that can do 250,000+ miles on its first transmission." },
    ],
  },

  // ─── BODY STYLE: SUVs ───────────────────────────────────────────────
  {
    slug: "suvs",
    make: "SUV",
    pluralNoun: "SUVs",
    filterType: "bodyStyle",
    filterValue: "SUV",
    title: "Used SUVs for Sale in Villa Park, IL | Love Auto Group",
    description:
      "Quality used SUVs in Villa Park, IL. AWD options, third-row seats, family-ready. Free Carfax, family owned since 2014. Serving DuPage County.",
    hero:
      "Family-ready used SUVs and crossovers — AWD options, third-row availability, and the kind of long-term reliability that makes one car last a decade.",
    intro:
      "If you're shopping for a used SUV in Villa Park, IL or anywhere in DuPage County, Love Auto Group keeps a curated rotation of compact, midsize, and three-row SUVs on the lot. Our specialty is Japanese vehicles — Subaru Outback and Forester, Honda CR-V and Pilot, Acura MDX, Lexus RX, Mazda CX-5 — which are consistently the strongest long-term picks in the SUV segment for total cost of ownership.",
    sections: [
      {
        heading: "Why a Used SUV Makes Sense for Chicago Families",
        body: [
          "Chicago-suburb winters demand AWD or 4WD, family schedules demand cargo space and third-row seating capability, and household budgets demand a vehicle that won't depreciate to nothing in three years. The used SUV market — specifically Japanese-made used SUVs — solves all three problems at the same time.",
          "We see this in our buyer mix: families upgrading from sedans to a Subaru Outback for the AWD and ground clearance, growing families stepping up to a Honda Pilot or Acura MDX for the third row, empty-nesters downsizing into a CR-V or RAV4-equivalent. The SUV segment is where most of our inventory turnover happens.",
        ],
      },
      {
        heading: "What's on the Lot",
        body: [
          "Our SUV inventory rotates weekly. Compact crossovers (Subaru Forester, Honda CR-V, Mazda CX-5, Toyota RAV4 when we can get them at auction) are the highest-volume segment. Midsize SUVs (Subaru Outback wagon-SUV, Lexus RX, Acura RDX) make up the luxury-leaning side. Three-row family SUVs (Honda Pilot, Acura MDX, occasional Toyota Highlander) move quickly when they hit the lot.",
          "We're a Carfax Advantage Dealer, so every SUV in our inventory comes with a free Carfax history report you can pull directly from the listing — accident history, service records, ownership chain, the full picture.",
        ],
      },
      {
        heading: "The Inspection Standard",
        body: [
          "SUVs work harder than sedans, especially in the Chicago suburbs. We inspect every used SUV for the items that matter on the platform — AWD coupling fluid condition, brake pad and rotor condition (heavier vehicles wear them faster), suspension components, third-row seat operation where applicable, and full electronic system function. If anything fails the inspection, the vehicle doesn't get listed.",
        ],
      },
      {
        heading: "Visit Our Villa Park Lot",
        body: [
          "We're at 735 N Yale Ave, Villa Park, IL 60181 — easy reach from Lombard, Elmhurst, Oak Brook, Glen Ellyn, Addison, and the broader DuPage County. Browse the live SUV inventory below or stop by during our extended afternoon hours.",
        ],
      },
    ],
    models: [
      { name: "Compact crossovers", pitch: "Subaru Forester, Honda CR-V, Mazda CX-5 — best total-cost-of-ownership SUVs." },
      { name: "Midsize wagons + SUVs", pitch: "Subaru Outback, Lexus RX, Acura RDX — luxury-feeling without the German repair bills." },
      { name: "Three-row family SUVs", pitch: "Honda Pilot, Acura MDX — real third-row utility with proven Honda drivetrains." },
    ],
  },

  // ─── BODY STYLE: SEDANS ─────────────────────────────────────────────
  {
    slug: "sedans",
    make: "Sedan",
    pluralNoun: "sedans",
    filterType: "bodyStyle",
    filterValue: "sedan",
    title: "Used Sedans for Sale in Villa Park, IL | Love Auto Group",
    description:
      "Used sedans in Villa Park, IL — Honda Accord, Toyota Camry, Lexus ES, Acura TLX. Free Carfax, family owned since 2014. DuPage County's Japanese specialists.",
    hero:
      "Commuter-ready used sedans with the highest resale value, lowest cost of ownership, and most efficient fuel economy in the market.",
    intro:
      "Sedans are still the smart-money play for commuters and value-focused buyers, and Love Auto Group has been a Japanese-sedan specialist since opening in Villa Park, IL in 2014. Our rotation includes Honda Accord and Civic, Toyota Camry and Corolla, Lexus ES and IS, Acura TLX and ILX, Mazda3 and Mazda6, and Subaru Legacy and Impreza — the deepest Japanese sedan inventory of any independent dealer in DuPage County.",
    sections: [
      {
        heading: "Why a Used Sedan Still Wins",
        body: [
          "The market has shifted heavily toward SUVs over the last decade, which has had a useful side effect: used Japanese sedans are some of the most underpriced vehicles in the secondary market right now. A clean 2018 Honda Accord with 80,000 miles costs less than the equivalent CR-V, gets 30+ MPG highway, drives noticeably better, and will likely outlast the SUV alternative in long-term reliability.",
          "For commuters running I-290, I-355, or the I-294 corridor every day, that's the math that matters.",
        ],
      },
      {
        heading: "What We Stock",
        body: [
          "Honda Civic and Accord are the highest-volume sedans on our lot — they sell themselves to commuters and first-time buyers. Toyota Camry and Corolla rotate regularly when we can find clean examples. Lexus ES is our luxury-sedan headline product. Acura TLX gives us the sport-sedan buyer. Mazda3 is the driver's-car pick. Subaru Legacy is the rare AWD sedan option for buyers who want sedan dynamics with winter-confident handling.",
        ],
      },
      {
        heading: "Inspection and Carfax Standard",
        body: [
          "Every used sedan in our inventory gets the same treatment as our SUVs: full mechanical inspection, platform-specific wear-item check, and a free Carfax history report. We're a Carfax Advantage Dealer — that report is free from any listing on our site, no email required.",
        ],
      },
      {
        heading: "Easy to Reach From the Western Suburbs",
        body: [
          "735 N Yale Ave, Villa Park, IL 60181. Five-to-fifteen minutes from Lombard, Elmhurst, Oak Brook, Glen Ellyn, and Addison. Browse the current sedan inventory below or call to ask about a specific model we should keep an eye out for.",
        ],
      },
    ],
    models: [
      { name: "Honda Civic & Accord", pitch: "The benchmark commuter sedans — best resale value in the segment." },
      { name: "Toyota Camry & Corolla", pitch: "Toyota reliability and the strongest used-sedan resale in the U.S." },
      { name: "Lexus ES & IS", pitch: "Luxury sedans on Toyota mechanical bones — at half the depreciation curve." },
      { name: "Acura TLX & ILX", pitch: "Honda-built luxury sedans with SH-AWD options on TLX." },
      { name: "Mazda3 & Mazda6", pitch: "The driver's-car picks. Premium interior at mainstream pricing." },
    ],
  },
];
