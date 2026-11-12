/**
 * Model landing pages: /used/{make}-{model}/
 *
 * Targets "used subaru forester joliet" style searches (model + town) and the
 * AI-answer question "where do I buy a used Subaru near Lombard". Each page is
 * grounded in what this lot has actually sold.
 *
 * WHERE THE NUMBERS COME FROM (read-only pull, 2026-11-12, Railway
 * /api/vehicles joined to /api/deals):
 *   - Counted: deals that are not WHOLESALE and not unwound/void, matched to
 *     the vehicle by vehicle_id. Our DMS sales history starts in 2018, so the
 *     counts say "since 2018". They are NOT "since 2014" and must not be
 *     written that way until older records exist.
 *   - Years and mileage: the middle half (25th to 75th percentile) of the
 *     cars sold since 2024-01-01, rounded.
 *   - Price band: the middle half of the deal prices on the same cars,
 *     rounded. vehicle.sold_price is NOT used (Railway stamps the asking
 *     price there). Sold cars carry no asking price in the DMS, so the deal
 *     price is the only real price on record.
 *
 * These figures are a snapshot. Re-run the same pull before changing them.
 */

export interface ModelFaq {
  question: string;
  answer: string;
}

export interface ModelLanding {
  /** URL segment: /used/{slug}/ */
  slug: string;
  make: string;
  /** Model as shown to shoppers. */
  model: string;
  /** Case-insensitive pattern matched against the DMS `model` field. */
  modelMatch: RegExp;
  /** Brand hub to link up to (/brands/{brandSlug}/). */
  brandSlug: string;
  title: string;
  description: string;
  stats: {
    soldSince2018: number;
    soldSince2024: number;
    typicalYears: string;
    typicalMiles: string;
  };
  /** One-sentence plain description of the model for the intro. */
  faqs: ModelFaq[];
}

const townsFaq = (make: string, model: string): ModelFaq => ({
  question: `Do you sell used ${make} ${model}s to buyers from Lombard, Elmhurst, Oak Brook, Glen Ellyn, Addison and Wheaton?`,
  answer: `Yes. Love Auto Group is at 735 N Yale Ave, Unit A in Villa Park, IL. Buyers regularly come to us from Lombard, Elmhurst, Oak Brook, Glen Ellyn, Addison, and Wheaton, and most of those are a short drive. If you want to be sure a ${model} is here before you make the trip, call 630-359-3643 or text 312-925-7520.`,
});

const noFeesFaq: ModelFaq = {
  question: "Do you charge dealer fees?",
  answer:
    "No. We charge no dealer fees. You pay the price on the car plus the Illinois tax, title, and license charges that the state requires.",
};

const waitlistFaq = (model: string, article: "a" | "an"): ModelFaq => ({
  question: `What if you do not have ${article} ${model} right now?`,
  answer:
    "Join the waitlist and tell us the years and budget you want. We will contact you when a matching car comes in.",
});

export const MODEL_LANDINGS: ModelLanding[] = [
  // ─── FORESTER ────────────────────────────────────────────────────────
  {
    slug: "subaru-forester",
    make: "Subaru",
    model: "Forester",
    modelMatch: /^forester/i,
    brandSlug: "subaru",
    title: "Used Subaru Forester Villa Park IL | Love Auto Group",
    description:
      "Used Subaru Forester for sale near Villa Park, IL. We have sold 23 since 2018. No dealer fees, free CARFAX on marked cars. Call 630-359-3643.",
    stats: {
      soldSince2018: 23,
      soldSince2024: 17,
      typicalYears: "2010 to 2018",
      typicalMiles: "about 145,000 to 180,000 miles",
    },
    faqs: [
      {
        question: "How many used Subaru Foresters has Love Auto Group sold?",
        answer:
          "Our sales records for the Villa Park lot go back to 2018. Since then we have sold 23 used Subaru Foresters, 17 of them since the start of 2024.",
      },
      {
        question: "What does a used Subaru Forester cost at Love Auto Group?",
        answer:
          "The Foresters we have sold since 2024 were mostly 2010 to 2018 models with about 145,000 to 180,000 miles. Cars we have in stock today are listed on this page, and you pay the price shown plus tax, title, and license.",
      },
      {
        question: "Does a used Forester with high miles make sense?",
        answer:
          "It can, if the price matches the miles and there are service records. A Forester with 150,000 miles and a clear maintenance history is a better bet than one with 100,000 miles and no records. Look the car over and drive it first.",
      },
      noFeesFaq,
      townsFaq("Subaru", "Forester"),
      waitlistFaq("Forester", "a"),
    ],
  },

  // ─── CROSSTREK ───────────────────────────────────────────────────────
  {
    slug: "subaru-crosstrek",
    make: "Subaru",
    model: "Crosstrek",
    modelMatch: /crosstrek/i,
    brandSlug: "subaru",
    title: "Used Subaru Crosstrek Villa Park IL | Love Auto Group",
    description:
      "Used Subaru Crosstrek (XV Crosstrek) for sale near Villa Park, IL. 22 sold since 2018. No dealer fees, free CARFAX on marked cars. 630-359-3643.",
    stats: {
      soldSince2018: 22,
      soldSince2024: 21,
      typicalYears: "2013 to 2017",
      typicalMiles: "about 135,000 to 170,000 miles",
    },
    faqs: [
      {
        question: "How many used Subaru Crosstreks has Love Auto Group sold?",
        answer:
          "Our sales records for the Villa Park lot go back to 2018. Since then we have sold 22 used Subaru Crosstreks, counting the earlier XV Crosstrek name, and 21 of them since the start of 2024.",
      },
      {
        question: "What does a used Subaru Crosstrek cost at Love Auto Group?",
        answer:
          "The Crosstreks we have sold since 2024 were mostly 2013 to 2017 models with about 135,000 to 170,000 miles. Cars we have in stock today are listed on this page, and you pay the price shown plus tax, title, and license.",
      },
      {
        question: "Is the XV Crosstrek the same car as the Crosstrek?",
        answer:
          "Yes. Subaru called it the XV Crosstrek through the 2017 model year and just Crosstrek after that. It is the same small all-wheel-drive hatchback, and the 2018 and newer cars are a redesigned version.",
      },
      noFeesFaq,
      townsFaq("Subaru", "Crosstrek"),
      waitlistFaq("Crosstrek", "a"),
    ],
  },

  // ─── OUTBACK ─────────────────────────────────────────────────────────
  {
    slug: "subaru-outback",
    make: "Subaru",
    model: "Outback",
    modelMatch: /^outback/i,
    brandSlug: "subaru",
    title: "Used Subaru Outback Villa Park IL | Love Auto Group",
    description:
      "Used Subaru Outback for sale near Villa Park, IL. We have sold 18 since 2018. No dealer fees, free CARFAX on marked cars. Call 630-359-3643.",
    stats: {
      soldSince2018: 18,
      soldSince2024: 12,
      typicalYears: "2013 to 2017",
      typicalMiles: "about 135,000 to 200,000 miles",
    },
    faqs: [
      {
        question: "How many used Subaru Outbacks has Love Auto Group sold?",
        answer:
          "Our sales records for the Villa Park lot go back to 2018. Since then we have sold 18 used Subaru Outbacks, 12 of them since the start of 2024.",
      },
      {
        question: "What does a used Subaru Outback cost at Love Auto Group?",
        answer:
          "The Outbacks we have sold since 2024 were mostly 2013 to 2017 models with about 135,000 to 200,000 miles. Cars we have in stock today are listed on this page, and you pay the price shown plus tax, title, and license.",
      },
      {
        question: "Outback or Forester?",
        answer:
          "Both have all-wheel drive. The Outback is longer and has more cargo room, and it rides more like a wagon. The Forester is taller, with a more upright seating position and a boxier back end. Come drive both if you can, since the seating position is the main difference people notice.",
      },
      noFeesFaq,
      townsFaq("Subaru", "Outback"),
      waitlistFaq("Outback", "an"),
    ],
  },
];
