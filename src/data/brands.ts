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
 *   - No "auction" / "technician" alt for the m-word / "pre-owned"
 *   - "Family owned" no hyphen
 *   - No exclamation marks in body
 *   - Specific over vague (price ranges, mile ranges, model years)
 *
 * Pricing and recommended model years should be refreshed annually as
 * newer used cars age into the lot. See README in seo-quickwins/brand-pages.
 */

export interface BrandContent {
  /** URL slug. Final URL is /brands/{slug}/ */
  slug: string;
  /** Display name for H1, breadcrumb, and inventory filter (case-insensitive match against vehicle.make) */
  displayName: string;
  /** Title tag, ~60 chars */
  metaTitle: string;
  /** Meta description, ~155 chars */
  metaDescription: string;
  /** Headline subline below the H1 */
  hero: string;
  /** Editorial body. Paragraphs in order, rendered above the inventory grid */
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
    faqs: [
      {
        question: "Are used Hondas reliable past 100,000 miles?",
        answer:
          "Yes, and it is not even close. A Honda with documented oil changes and a clean Carfax routinely runs 180,000 to 220,000 miles before any major drivetrain work. The 2.4L K24 four-cylinder in the Accord and CR-V is one of the most durable engines ever built. On our lot we focus on Hondas with full service history so you are not buying someone else's neglect.",
      },
      {
        question: "What is the most reliable used Honda SUV?",
        answer:
          "The CR-V is the safest pick. The 2013 to 2017 generation with the 2.4L four-cylinder is the value sweet spot, well past the early-life issues and still current inside. The Pilot is excellent too, but the V6 with variable cylinder management needs documented oil services. We inspect both during recon and only price the ones that pass.",
      },
      {
        question: "Should I worry about CVT transmissions in used Hondas?",
        answer:
          "Only if maintenance was skipped. Honda's CVT (in later CR-Vs and Civics) is reliable when the fluid is changed every 30,000 to 40,000 miles. The failures you read about online are almost always neglect cases. We check fluid condition and look for documented services in the Carfax before we put a CR-V on the lot.",
      },
      {
        question: "Is a used Honda Pilot a good family vehicle?",
        answer:
          "Yes, and it is one of the most underrated three-row buys on the used market. The Pilot has a roomier third row than most competitors, the AWD system is genuinely capable in Chicago winters, and resale value is excellent. The honest watch-out is the V6 oil consumption on early variable cylinder management models, which is why we inspect every Pilot during recon.",
      },
      {
        question: "How much should I expect to pay for a good used Honda Civic?",
        answer:
          "On our lot, a 2014 to 2017 Civic with 90,000 to 130,000 miles typically runs $8,000 to $12,000 depending on trim and condition. The EX trim with sunroof and alloys is the best value. Call (630) 359-3643 if you want us to flag the next one that lands.",
      },
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
    faqs: [
      {
        question: "What is the difference between Subaru AWD and 4WD?",
        answer:
          "Subaru's symmetrical all-wheel drive sends power to all four wheels all the time, with a center differential balancing the torque split. Traditional 4WD on a truck or SUV (like a Tacoma or 4Runner) is a part-time system you engage with a lever or button for off-road use. For Chicago winters and unplowed side streets, Subaru's full-time AWD is the better tool because it is always on and requires no driver input.",
      },
      {
        question: "Are Subaru head gasket problems still an issue?",
        answer:
          "Not on the cars we sell. The head gasket failures Subaru is famous for were on the 2.5L EJ25 engine through about 2011. Foresters, Outbacks, and Crosstreks from 2014 forward use the FB25 engine, which redesigned the gasket and head architecture. We still check gasket area and coolant condition on every Subaru during recon, but it is not the worry it used to be.",
      },
      {
        question: "How long does a used Subaru Forester last?",
        answer:
          "A 2014 or newer Forester with documented oil changes and CVT fluid services routinely runs past 250,000 miles. The four-cylinder boxer engine is overbuilt for daily driving, and the AWD system is simple by design. We focus on Foresters in the 80,000 to 140,000 mile range, which on this platform is barely halfway through life.",
      },
      {
        question: "Is the Subaru CVT reliable?",
        answer:
          "Yes, when fluid is changed every 30,000 to 40,000 miles. Subaru's CVT (Lineartronic) had some early issues on 2010 to 2014 models that were addressed under warranty extension. Post-2015 units have proven durable. We pull the dipstick and check fluid color on every CVT Subaru and only list the ones with clean service history.",
      },
      {
        question: "Outback or Forester, which is better for snow?",
        answer:
          "Both have the same symmetrical AWD and roughly the same ground clearance (8.7 inches on the Forester, 8.7 on the Outback). The Forester has a taller, more upright body that gives better visibility in heavy snow. The Outback has a longer wheelbase that feels more planted on highway drives. For a DuPage County winter commute, either one will outperform almost any 2WD competitor.",
      },
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
      "RX, ES, IS, and the occasional GX. Toyota drivetrains wearing a tailored suit.",
    body: [
      "The Lexus RX is the most reliable mid-size luxury SUV ever built, and the ES is the closest thing to a Toyota Avalon wearing a tailored suit. Both are platforms that hold up well past 200,000 miles when serviced properly. That is why we keep them in regular rotation on our lot.",
      "We typically stock used Lexus models in the $12,000 to $19,000 range, focused on the 2010 to 2017 model years where prices have come down from new but the cars still feel current inside. Most are in the 90,000 to 130,000 mile range, which on a Lexus is barely broken in.",
      "Every used Lexus on our lot has been carefully selected and fully reconditioned before it gets a price tag. We pull a free Carfax on every vehicle and review it before listing. We are a Carfax Advantage Dealer, which means our reports are pulled and reviewed before the car is offered, and we share them with you before you ask.",
      "The Lexus models we see most often: the RX 350 (third-generation 2010 to 2015 is the value sweet spot), the ES 350, the IS 250 and IS 300, and the occasional GX 460 for buyers who want a body-on-frame Lexus SUV with real off-road ability. If you are looking for a specific model or trim, call (630) 359-3643 and we will let you know when one lands.",
    ],
    faqs: [
      {
        question: "Are Lexus parts more expensive than Toyota parts?",
        answer:
          "Some are, most are not. The drivetrain on a Lexus RX or ES is essentially identical to the Toyota Highlander or Avalon, so engine, transmission, suspension, and brake parts price the same. Where it gets pricier is interior trim, leather, and Lexus-specific exterior body panels. For routine service, a Lexus costs about the same as the equivalent Toyota.",
      },
      {
        question: "How long do used Lexus RX 350s last?",
        answer:
          "The RX 350 with the 2GR-FE 3.5L V6 routinely runs past 250,000 miles when serviced properly. It is the same engine family used in Toyota Highlanders and Camrys, just with better insulation and a nicer interior. We focus on third-gen 2010 to 2015 RX 350s in the 90,000 to 130,000 mile range, which on this platform is barely broken in.",
      },
      {
        question: "Is a used Lexus a good winter car?",
        answer:
          "Yes, especially the all-wheel drive RX 350 and the GX 460. The RX has a responsive AWD system that engages quickly on slick surfaces, and the GX is a true body-on-frame SUV with a low-range transfer case. The rear-wheel drive ES 350 and IS 250 need decent winter tires to be at their best in heavy snow.",
      },
      {
        question: "Should I buy a used Lexus IS 250 or IS 350?",
        answer:
          "The IS 250 is the volume car and the better used-market value. The 2.5L V6 is reliable and parts are cheap, though the car is not fast. The IS 350 with the 3.5L V6 is genuinely quick and the engine is bulletproof, but used examples are rarer and command a premium. For daily driving, the IS 250 is the smart pick.",
      },
      {
        question: "What should I check before buying a used Lexus?",
        answer:
          "Service history first. Lexus owners who follow the maintenance schedule produce cars that go 250,000 miles without drama. Owners who skip services produce expensive problems. We pull a Carfax on every Lexus, review the service record before listing, and inspect the suspension air struts on GX models specifically (a known wear point). Carfax Advantage Dealer status means you see the report before you ask.",
      },
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
    faqs: [
      {
        question: "Is a used Acura just a fancy Honda?",
        answer:
          "In the best possible way, yes. Acura uses the same engines, transmissions, and platform fundamentals as Honda, then adds nicer interiors, better sound deadening, sharper suspension tuning, and SH-AWD on most models. You get Honda reliability with luxury features and a price that drops sharply once the original owner takes the depreciation hit.",
      },
      {
        question: "How much does a timing belt service cost on a used Acura MDX?",
        answer:
          "Plan on $900 to $1,400 for a full job done right (timing belt, water pump, tensioner, idlers, and serpentine belt) at an independent shop. The interval is around 105,000 miles or 7 years, whichever comes first. We check timing belt service history on every V6 Acura before listing because a documented service is the single biggest factor in trouble-free ownership going forward.",
      },
      {
        question: "What is SH-AWD and is it good in snow?",
        answer:
          "Super Handling All-Wheel Drive is Acura's torque-vectoring AWD system. It can send up to 70 percent of power to the rear axle and split that further between the rear wheels, which gives genuinely sporty handling in dry weather and excellent traction in snow. On an MDX in a Chicago winter, SH-AWD is one of the most capable systems you can get short of a true off-road truck.",
      },
      {
        question: "Are Acura RDX turbos reliable?",
        answer:
          "The 2013 to 2018 RDX uses the naturally aspirated 3.5L V6 (no turbo), and that drivetrain is essentially bulletproof. The 2019-and-newer RDX moved to a 2.0L turbocharged four-cylinder, which has held up well so far but has a shorter track record. We mostly stock the V6 generation because the long-term data is in and it is overwhelmingly positive.",
      },
      {
        question: "Why is a used Acura cheaper than a comparable Lexus?",
        answer:
          "Brand recognition. Lexus has built decades of luxury positioning that commands a price premium on the used market. Under the hood the gap is small, especially on the MDX vs RX comparison where both are based on best-in-class drivetrains. If you do not need the Lexus badge, an Acura gets you 90 percent of the experience for 70 percent of the price.",
      },
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
    faqs: [
      {
        question: "Which Mazda is best for snow?",
        answer:
          "The CX-5 with i-Activ all-wheel drive is the strongest pick. It has 7.6 inches of ground clearance, an AWD system that proactively shifts torque before slip happens, and good visibility from the driver's seat. The CX-9 is also AWD-capable and works well for larger families. The Mazda3 and Mazda6 are front-wheel drive only, which is usable with quality winter tires but not ideal for unplowed roads.",
      },
      {
        question: "Are Skyactiv engines reliable?",
        answer:
          "Yes. The 2.0L and 2.5L Skyactiv-G engines used since 2014 have proven durable past 200,000 miles when serviced properly. The high compression ratio (13:1 or 14:1 depending on year) means oil quality matters more than on a typical engine, so we look for documented synthetic oil services on every Mazda before pricing it.",
      },
      {
        question: "How does a used Mazda CX-5 compare to a Honda CR-V?",
        answer:
          "The CR-V wins on third-row reliability data and resale value. The CX-5 wins on interior quality, driving feel, and ride sharpness. For buyers who want a small SUV that feels closer to a luxury car than to a transportation appliance, the CX-5 is the pick. For buyers who want maximum hold-its-value durability, the CR-V is the safer call. We stock both and let you drive them back to back.",
      },
      {
        question: "Do Mazdas hold their value?",
        answer:
          "Better than they used to. The pre-2014 Mazdas depreciated faster than Honda or Toyota equivalents. Post-Skyactiv generation, resale has tightened up because reliability data is now in line with Japanese-segment leaders. The CX-5 in particular holds value well, and the Mazda3 has cult appeal that keeps used prices firm in nicer trims.",
      },
      {
        question: "What should I check before buying a used CX-5?",
        answer:
          "On AWD models, check the rear differential fluid and the propeller shaft for noise, since Mazda specified service intervals that not every prior owner followed. Also check the touchscreen for the 2014 to 2017 Mazda Connect system, which can develop bugs. We inspect both during recon and pull a free Carfax to confirm fluid services in the documented history before pricing.",
      },
    ],
    relatedLinks: [
      { label: "View buyer FAQ", href: "/faq/" },
      { label: "Free Carfax on every Mazda", href: "/free-carfax-villa-park/" },
    ],
  },

  // TOYOTA
  {
    slug: "toyota",
    displayName: "Toyota",
    metaTitle: "Used Toyota for Sale in Villa Park, IL | Love Auto Group",
    metaDescription:
      "Used Toyota Camry, Corolla, RAV4, Highlander, and Tacoma in Villa Park, IL. Zero-drama ownership. $9,000 to $16,000 range. Free Carfax. (630) 359-3643.",
    hero:
      "Zero-drama ownership. Camry, Corolla, RAV4, Highlander, and the occasional Tacoma.",
    body: [
      "Toyota does not make the flashiest car in any segment, and that is exactly the point. The Camry, Corolla, RAV4, and Highlander are built to start every morning, run for fifteen years, and hand over to the next owner without drama. Used Toyotas hold their value because the cars actually run, and that is why they are a steady part of our inventory mix.",
      "We typically stock used Toyota models in the $9,000 to $16,000 range, focused on 2014 to 2018 model years with 80,000 to 140,000 miles. The 2.5L 2AR-FE four-cylinder in the Camry and the RAV4, the 3.5L 2GR-FKS V6 in the Highlander, and the legendary 1GR-FE V6 in the Tacoma are all engines that routinely run past 250,000 miles when serviced correctly.",
      "Every used Toyota on our lot has been carefully selected and fully reconditioned before it is listed. We pull a free Carfax on every vehicle and review service history before pricing. On RAV4s with AWD we check the rear differential and the coupling fluid. On Highlanders we look at the V6 water pump (a known wear point around 100,000 miles). On Tacomas we inspect the frame for rust history, since older trucks had a frame recall and pricing varies based on whether the truck was inspected, replaced, or untouched.",
      "The Toyota models we see most often: the Camry (the volume reliability play), the Corolla (the entry-level commuter that refuses to die), the RAV4 (compact SUV with class-leading resale), the Highlander (three-row family hauler that competes with the Pilot and Pathfinder), and the occasional Tacoma (the mid-size truck with the strongest resale value of anything we sell). We also see Sienna, Prius, and the GR86 for the buyer who wants a Toyota that turns better than it accelerates.",
    ],
    faqs: [
      {
        question: "How long do Toyota Camrys typically last?",
        answer:
          "A Camry with documented oil services routinely runs 250,000 to 300,000 miles before any major drivetrain work. The 2.5L 2AR-FE four-cylinder used from 2010 onward is one of the most over-engineered engines in the industry. We focus on Camrys in the 80,000 to 140,000 mile range, which on this platform is barely halfway through life.",
      },
      {
        question: "Why do used Toyota Tacomas hold their value so well?",
        answer:
          "Three reasons: the 1GR-FE V6 is famously durable, the truck is simple under the hood compared to most modern pickups, and Toyota does not flood the market with new ones. That combination keeps used demand high and depreciation low. A 10-year-old Tacoma in good condition can still command 60 to 70 percent of its original sticker, which is unheard of in the truck world.",
      },
      {
        question: "Should I worry about Toyota Highlander timing chain or belt?",
        answer:
          "The 2008-and-newer Highlander uses a timing chain, not a belt, which means no scheduled replacement in normal use. The watch-out is the V6 water pump, which can start weeping around 100,000 to 120,000 miles. That is a $400 to $700 job at an independent shop. We check every Highlander for water pump seepage during recon.",
      },
      {
        question: "Is a used Toyota RAV4 better than a CR-V or Forester?",
        answer:
          "Each has a different strength. The RAV4 wins on Toyota's long-term reliability reputation and resale value. The CR-V has a more refined interior and slightly better fuel economy. The Forester has more usable cargo room and full-time symmetrical AWD. We stock all three, and the right pick comes down to which trade-off matters most to you. Drive them back to back and pick the one that fits.",
      },
      {
        question: "Are used Toyota Priuses worth buying with high miles?",
        answer:
          "Yes, more than people realize. The hybrid drivetrain is famously durable, and the traction battery on Gen 3 (2010 to 2015) Priuses regularly lasts 200,000 miles or more. Replacement batteries are now available from independent rebuilders for $1,200 to $2,000, far less than the dealer figure people quote online. A high-mile Prius with a clean Carfax can be one of the best dollar-per-mile buys on the used market.",
      },
      {
        question: "What is the Toyota GR86 and who is it for?",
        answer:
          "The GR86 (and its Subaru BRZ twin) is Toyota's enthusiast coupe: rear-wheel drive, manual or automatic, 2.4L flat-four, light weight, sharp steering. It is not fast in a straight line, but it handles like a much more expensive sports car. If a used one shows up on our lot, it is going to a buyer who specifically wants a fun weekend car that gets 30 miles per gallon on the highway.",
      },
    ],
    relatedLinks: [
      { label: "View buyer FAQ", href: "/faq/" },
      { label: "Free Carfax on every Toyota", href: "/free-carfax-villa-park/" },
    ],
  },
];
