/**
 * Mark-authored content for brand-specific SEO landing pages at
 * `/brands/{slug}/`.
 *
 * Source copy: `C:\Claude AI\seo-quickwins\brand-pages\inventory-used-{slug}.md`
 * (task #19, Mark's 5 brand category page rewrites).
 *
 * Each entry powers a `/brands/{slug}/` route. These pages target
 * brand-only keyword clusters ("used Honda Villa Park", "used Lexus
 * DuPage County") with editorial copy above a live-inventory grid
 * filtered to the matching make. Voice-rule clean per Mark:
 *   - No em dashes
 *   - No "auction" / "mechanic" / "pre-owned"
 *   - "Family owned" no hyphen
 *   - No exclamation marks in body
 *   - Specific over vague (price ranges, mile ranges, model years)
 *
 * Pricing and recommended model years should be refreshed annually as
 * newer used cars age into the lot. See README in seo-quickwins/brand-pages.
 */

export interface BrandContent {
  /** URL slug — final URL is /brands/{slug}/ */
  slug: string;
  /** Display name for H1, breadcrumb, and inventory filter (case-insensitive match against vehicle.make) */
  displayName: string;
  /** Title tag, ~60 chars */
  metaTitle: string;
  /** Meta description, ~155 chars */
  metaDescription: string;
  /** Headline subline below the H1 */
  hero: string;
  /** Editorial body — paragraphs in order, rendered above the inventory grid */
  body: string[];
  /** Optional FAQ. When present, the page emits FAQPage JSON-LD. */
  faqs?: { question: string; answer: string }[];
  /** Internal links surfaced at the bottom of the editorial. */
  relatedLinks?: { label: string; href: string }[];
}

export const BRANDS: BrandContent[] = [
  // HONDA
  {
    slug: "honda",
    displayName: "Honda",
    metaTitle: "Used Honda for Sale in Villa Park, IL | Love Auto Group",
    metaDescription:
      "Used Honda Pilot, CR-V, Accord, and Civic in Villa Park, IL. The reliability standard. $8,000 to $15,000 range. Free Carfax. Family owned. (630) 359-3643.",
    hero:
      "The reliability standard, in steady rotation on our Villa Park lot.",
    body: [
      "Honda built its reputation on drivetrains that simply do not quit. The CR-V routinely runs past 200,000 miles. The Pilot is a three-row family vehicle that holds resale value better than almost anything in its segment. The Accord and Civic both age past 150,000 miles with nothing more than routine service. That is why we keep used Hondas in steady rotation on our lot.",
      "We typically stock used Honda models in the $8,000 to $15,000 range, focused on 2013 to 2017 model years with 80,000 to 140,000 miles. The drivetrains in this generation are well past their teething period, prices have come down significantly, and the cars still feel current inside.",
      "Every used Honda on our lot has been carefully selected and fully reconditioned before it is listed. On the CR-V and the Pilot we look at the variable cylinder management on the V6 (a known wear point), the CVT behavior on later CR-V models, and the all-wheel drive engagement. We pull a free Carfax on every vehicle and review it for documented oil services and any open recalls.",
      "The Honda models we see most often: the CR-V (the bestselling compact SUV in America for a reason), the Pilot (three-row family vehicle), the Accord (mid-size sedan that sets the segment standard), and the Civic in either sedan or coupe form.",
    ],
    relatedLinks: [
      { label: "View buyer FAQ", href: "/faq/" },
      { label: "Free Carfax on every Honda", href: "/free-carfax-villa-park/" },
    ],
  },

  // SUBARU
  {
    slug: "subaru",
    displayName: "Subaru",
    metaTitle: "Used Subaru for Sale in Villa Park, IL | Love Auto Group",
    metaDescription:
      "Used Subaru Forester, Outback, Crosstrek, and Legacy in Villa Park, IL. AWD-ready for Chicago winters. $9,000 to $15,000 range. Free Carfax. (630) 359-3643.",
    hero:
      "AWD-ready for Chicago winters. Foresters, Outbacks, and Crosstreks in regular rotation.",
    body: [
      "A Subaru built after 2014 will run past 250,000 miles when properly maintained. That is not a marketing claim. That is what every long-term reliability study and what we see at the buying stage shows us. Foresters, Outbacks, and Crosstreks from the second-generation 2014 to 2017 era are the value sweet spot in the used Subaru market, and they are exactly what we keep in rotation on our lot in Villa Park.",
      "We typically stock used Subarus in the $9,000 to $15,000 range, focused on 2014 to 2018 model years with 80,000 to 140,000 miles. Symmetrical all-wheel drive, eight inches of ground clearance on the Forester, and the kind of all-season capability that handles a DuPage County winter without drama.",
      "Every used Subaru on our lot has been carefully selected and fully reconditioned before it is listed for sale. We look specifically at the head gasket area, the CVT transmission behavior, and the all-wheel drive engagement during our pre-listing inspection. We also pull a free Carfax on every vehicle, looking for documented CVT fluid services, head gasket history, and consistent oil change records.",
      "The Subaru models we see most often: the Forester (the workhorse), the Outback (more interior space, smoother on the highway), the Crosstrek (lighter, smaller, easier on fuel), and the occasional Legacy sedan for buyers who do not need the wagon body.",
    ],
    relatedLinks: [
      { label: "View buyer FAQ", href: "/faq/" },
      { label: "Free Carfax on every Subaru", href: "/free-carfax-villa-park/" },
    ],
  },

  // LEXUS
  {
    slug: "lexus",
    displayName: "Lexus",
    metaTitle: "Used Lexus for Sale in Villa Park, IL | Love Auto Group",
    metaDescription:
      "Used Lexus inventory in Villa Park, IL. RX 350, ES, IS, GX in the $12,000 to $19,000 range. Free Carfax. Family owned since 2014. (630) 359-3643.",
    hero:
      "RX, ES, IS, and the occasional GX. Toyota mechanicals wearing a tailored suit.",
    body: [
      "The Lexus RX is the most reliable mid-size luxury SUV ever built, and the ES is the closest thing to a Toyota Avalon wearing a tailored suit. Both are platforms that hold up well past 200,000 miles when serviced properly. That is why we keep them in regular rotation on our lot.",
      "We typically stock used Lexus models in the $12,000 to $19,000 range, focused on the 2010 to 2017 model years where prices have come down from new but the cars still feel current inside. Most are in the 90,000 to 130,000 mile range, which on a Lexus is barely broken in.",
      "Every used Lexus on our lot has been carefully selected and fully reconditioned before it gets a price tag. We pull a free Carfax on every vehicle and review it before listing. We are a Carfax Advantage Dealer, which means our reports are pulled and reviewed before the car is offered, and we share them with you before you ask.",
      "The Lexus models we see most often: the RX 350 (third-generation 2010 to 2015 is the value sweet spot), the ES 350, the IS 250 and IS 300, and the occasional GX 460 for buyers who want a body-on-frame Lexus SUV with real off-road ability. If you are looking for a specific model or trim, call (630) 359-3643 and we will let you know when one lands.",
    ],
    relatedLinks: [
      { label: "View buyer FAQ", href: "/faq/" },
      { label: "Free Carfax on every Lexus", href: "/free-carfax-villa-park/" },
    ],
  },

  // ACURA
  {
    slug: "acura",
    displayName: "Acura",
    metaTitle: "Used Acura for Sale in Villa Park, IL | Love Auto Group",
    metaDescription:
      "Used Acura MDX, TL, RDX, and TLX in Villa Park, IL. Honda reliability with luxury features. $8,000 to $14,000 range. Free Carfax. (630) 359-3643.",
    hero:
      "Honda reliability with luxury features. MDX, TL, RDX in regular rotation.",
    body: [
      "Acura is what happens when Honda engineers a luxury vehicle. Same drivetrains, same long-haul reliability, and a price that drops sharply in the used market. The MDX in particular is one of the most underrated three-row vehicles on the road today, and the SH-AWD system is a genuine all-weather asset for a Chicago winter.",
      "We typically stock used Acura models in the $8,000 to $14,000 range, focused on the 2010 to 2015 model years with reasonable miles. The drivetrains in this generation are well past the point where any major issues would have surfaced, and the prices have come down enough that the value math is hard to argue with.",
      "Every used Acura on our lot has been carefully selected and fully reconditioned before it is listed. On the V6 models we look specifically at the timing belt service history (due around 105,000 miles), the transmission fluid record, and the variable cylinder management performance. A documented timing belt service is the single biggest factor in whether an Acura is going to give the next owner trouble-free miles.",
      "The Acura models we see most often: the MDX (three-row workhorse with SH-AWD), the TL (luxury sedan with sharp handling), the RDX (compact SUV with the turbocharged four-cylinder in later years), and the occasional TSX for buyers who want a manual transmission option.",
    ],
    relatedLinks: [
      { label: "Soft credit pre-approval", href: "/financing/" },
      { label: "Free Carfax on every Acura", href: "/free-carfax-villa-park/" },
    ],
  },

  // MAZDA
  {
    slug: "mazda",
    displayName: "Mazda",
    metaTitle: "Used Mazda for Sale in Villa Park, IL | Love Auto Group",
    metaDescription:
      "Used Mazda CX-5, Mazda3, Mazda6, and CX-9 in Villa Park, IL. The driver's pick on the used market. $9,000 to $15,000 range. Free Carfax. (630) 359-3643.",
    hero:
      "The driver's pick. CX-5, Mazda3, Mazda6, and the occasional CX-9.",
    body: [
      "Mazda is the driver's pick on the used market. The interiors are a step above the segment, the steering and ride balance are notably sharper than competitors, and Mazda's reliability has caught up with Honda and Toyota in the post-2014 generations. The CX-5 in particular is one of the better-aging compact SUVs you can buy used in this price range.",
      "We typically stock used Mazda models in the $9,000 to $15,000 range, focused on 2014 to 2018 model years with 80,000 to 130,000 miles. Skyactiv engines have proven reliable, the available all-wheel drive on the CX-5 and CX-9 is responsive, and the cabin feels current even on five-year-old examples.",
      "Every used Mazda on our lot has been carefully selected and fully reconditioned before it is listed. On the CX-5 specifically we inspect the rear differential and the propeller shaft on all-wheel drive models, since Mazda specified service intervals that not every prior owner followed. We pull a free Carfax on every vehicle and confirm fluid services in the documented history before pricing.",
      "The Mazda models we see most often: the CX-5 (the value play in the compact SUV segment), the Mazda3 (compact car with luxury-segment driving feel), the Mazda6 (mid-size sedan), and the occasional CX-9 for buyers who need three rows.",
    ],
    relatedLinks: [
      { label: "View buyer FAQ", href: "/faq/" },
      { label: "Free Carfax on every Mazda", href: "/free-carfax-villa-park/" },
    ],
  },
];
