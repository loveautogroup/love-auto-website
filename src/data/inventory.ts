import { Vehicle } from "@/lib/types";

/**
 * Real inventory data synced from Dealer Center.
 * Last sync: April 18, 2026
 * Source: app.dealercenter.net — Love Auto Group active inventory
 *
 * Photo naming: /images/inventory/{slug}/card-{year}-{make}-{model}-{n}.webp
 * In production, David (DMS agent) provides the live feed.
 */

function generateImagePaths(
  slug: string,
  year: number,
  make: string,
  model: string,
  count: number
): string[] {
  const base = `/images/inventory/${slug}`;
  const prefix = `${year}-${make.toLowerCase()}-${model.toLowerCase()}`;
  return Array.from({ length: count }, (_, i) => `${base}/${prefix}-${i + 1}.webp`);
}

export const sampleInventory: Vehicle[] = [
  {
    id: "11334",
    slug: "2016-honda-pilot-touring-11334",
    vin: "5FNYF6H9XGB041495",
    stockNumber: "11334",
    year: 2016,
    make: "Honda",
    model: "Pilot",
    trim: "Touring",
    price: 10999,
    mileage: 164623,
    exteriorColor: "Silver",
    interiorColor: "Gray",
    drivetrain: "AWD",
    transmission: "9-Speed Automatic",
    engine: "3.5L V6 i-VTEC",
    bodyStyle: "SUV",
    fuelType: "Gasoline",
    description:
      "Honda's flagship Pilot trim, loaded with every option they offered in 2016. Third-row seating, adaptive cruise, LaneWatch blind spot camera, navigation, heated leather, and rear A/C for the whole crew. The 3.5L V6 with AWD turns 280 horsepower and takes Illinois winters in stride. 164,623 miles, and that matters less than how the car has been cared for. We replaced the wear items, checked every fluid, and detailed it inside and out before listing. $10,999, ready to drive home. Call or text (630) 359-3643 to set up a test drive at 735 N Yale Ave, Villa Park.",
    features: [
      "All-Wheel Drive",
      "Navigation System",
      "Adaptive Cruise Control",
      "Honda LaneWatch",
      "Premium Audio System",
      "Heated Leather Seats",
      "Power Liftgate",
      "Rear A/C",
      "Keyless Entry & Start",
      "Bluetooth & SiriusXM",
      "Backup Camera",
    ],
    images: generateImagePaths("2016-honda-pilot-touring-4d", 2016, "honda", "pilot", 30),
    // Sold 04/13/2026 per DealerCenter; flipped to "sold" Apr 23 2026
    // so the inventory grid auto-hides it. Listing data preserved for
    // when the live inventory-sync Cron Worker takes over status drift.
    status: "sold",
    dateInStock: "2026-04-13",
    daysOnLot: 5,
  },
  {
    id: "11331",
    slug: "2017-ford-mustang-ecoboost-premium-11331",
    vin: "1FA6P8TH6H1202495",
    stockNumber: "11331",
    year: 2017,
    make: "Ford",
    model: "Mustang",
    trim: "EcoBoost Premium",
    price: 13999,
    mileage: 89085,
    exteriorColor: "Blue",
    interiorColor: "Black",
    drivetrain: "RWD",
    transmission: "6-Speed Automatic SelectShift",
    engine: "2.3L 4-Cylinder EcoBoost Turbo",
    bodyStyle: "Coupe",
    fuelType: "Gasoline",
    description:
      "The smart Mustang. 310 turbocharged horsepower from the 2.3L EcoBoost, real Mustang presence, and the kind of fuel economy that doesn't punish you for enjoying the drive. This is the Premium trim: heated and cooled leather seats, SYNC 3 with the 8-inch touchscreen, push-button start, dual-zone climate, and HID headlamps. 89,085 miles on the clock, carefully selected and fully reconditioned. $13,999. Test drive available today at our Villa Park lot. Call or text (630) 359-3643.",
    features: [
      "EcoBoost 2.3L Turbo (310 HP)",
      "Leather Heated & Cooled Seats",
      "SYNC 3 with 8\" Touchscreen",
      "Push Button Start",
      "Rear View Camera",
      "Bluetooth",
      "Dual Zone Climate Control",
      "SelectShift Automatic",
      "Performance Exhaust",
      "HID Headlamps",
    ],
    images: generateImagePaths("2017-ford-mustang-ecoboost-premium-2d", 2017, "ford", "mustang", 21),
    status: "available",
    dateInStock: "2026-04-06",
    daysOnLot: 12,
  },
  {
    id: "11318",
    slug: "2010-acura-mdx-sport-11318",
    vin: "2HNYD2H63AH509874",
    stockNumber: "11318",
    year: 2010,
    make: "Acura",
    model: "MDX",
    trim: "Sport",
    price: 4499,
    mileage: 213197,
    exteriorColor: "Black",
    interiorColor: "Black",
    drivetrain: "AWD",
    transmission: "5-Speed Automatic",
    engine: "3.7L V6 VTEC",
    bodyStyle: "SUV",
    fuelType: "Gasoline",
    description:
      "A three-row luxury SUV for under $5,000 is rare. One that still drives this well at 213,000 miles is rarer. The MDX Sport is built on the same platform as the Honda Pilot but with Acura's Super Handling AWD, the high-output 3.7L VTEC V6, leather interior, moonroof, and the kind of reliability Japanese engineering is known for. Thoroughly inspected and fully reconditioned by our in-house team. $4,499, priced at the value end but built to the same standard as everything else on the lot. Call or text (630) 359-3643 to see it at 735 N Yale Ave, Villa Park.",
    features: [
      "Super Handling All-Wheel Drive (SH-AWD)",
      "3.7L VTEC V6",
      "Third Row Seating",
      "Leather Interior",
      "Power Moonroof",
      "Bluetooth HandsFreeLink",
      "Rearview Camera",
      "Heated Front Seats",
      "Power Liftgate",
    ],
    images: generateImagePaths("2010-acura-mdx-sport-4d", 2010, "acura", "mdx", 23),
    status: "available",
    dateInStock: "2025-12-22",
    daysOnLot: 117,
  },
  {
    id: "11316",
    slug: "2013-gmc-terrain-slt-11316",
    vin: "2GKALJEK6D1300009",
    stockNumber: "11316",
    year: 2013,
    make: "GMC",
    model: "Terrain",
    trim: "SLT-1",
    price: 4999,
    mileage: 151419,
    exteriorColor: "White",
    interiorColor: "Black",
    drivetrain: "FWD",
    transmission: "6-Speed Automatic",
    engine: "2.4L 4-Cylinder",
    bodyStyle: "SUV",
    fuelType: "Gasoline",
    description:
      "A well-equipped compact SUV under $5,000. The SLT-1 trim is the Terrain with the good stuff: heated leather seats, Pioneer premium audio, remote start, touchscreen infotainment, backup camera, and a comfortable ride that takes daily commutes and weekend errands with ease. 151,419 miles, thoroughly inspected and fully reconditioned by our in-house team. $4,999. Stop by 735 N Yale Ave or call (630) 359-3643 to set up a test drive.",
    features: [
      "Leather Heated Seats",
      "Touchscreen Infotainment",
      "Bluetooth",
      "Backup Camera",
      "Remote Start",
      "Power Driver Seat",
      "OnStar",
      "Pioneer Premium Audio",
    ],
    images: generateImagePaths("2013-gmc-terrain-slt-4d", 2013, "gmc", "terrain", 15),
    status: "available",
    dateInStock: "2025-12-22",
    daysOnLot: 117,
  },
  {
    id: "11313",
    slug: "2017-hyundai-accent-se-11313",
    vin: "KMHCT4AE6HU222547",
    stockNumber: "11313",
    year: 2017,
    make: "Hyundai",
    model: "Accent",
    trim: "SE",
    price: 3999,
    mileage: 157597,
    exteriorColor: "Silver",
    interiorColor: "Gray",
    drivetrain: "FWD",
    transmission: "6-Speed Automatic",
    engine: "1.6L 4-Cylinder",
    bodyStyle: "Sedan",
    fuelType: "Gasoline",
    description:
      "Efficient, reliable, and under $4,000. The Accent SE delivers 36 highway MPG from its 1.6L engine, keeping fuel costs low for commuters and first-time buyers. Power windows, keyless entry, air conditioning, and a full complement of airbags and stability control. 157,597 miles, thoroughly inspected and fully reconditioned. A solid, no-nonsense daily driver that won't stretch your budget. $3,999. Call or text (630) 359-3643.",
    features: [
      "1.6L Engine (137 HP)",
      "26 City / 36 Highway MPG",
      "Power Windows",
      "Air Conditioning",
      "Keyless Entry",
      "Electronic Stability Control",
      "ABS Brakes",
      "Dual Air Bags",
      "Side Air Bags",
    ],
    images: generateImagePaths("2017-hyundai-accent-4d", 2017, "hyundai", "accent", 21),
    status: "available",
    dateInStock: "2026-02-12",
    daysOnLot: 65,
  },
  {
    id: "11266",
    slug: "2016-lexus-rc-350-11266",
    vin: "JTHHE5BC2G5011456",
    stockNumber: "11266",
    year: 2016,
    make: "Lexus",
    model: "RC 350",
    trim: "Base",
    price: 17999,
    mileage: 135116,
    exteriorColor: "Black",
    interiorColor: "Brown Leather",
    drivetrain: "RWD",
    transmission: "8-Speed Automatic",
    engine: "3.5L V6",
    bodyStyle: "Coupe",
    fuelType: "Gasoline",
    description:
      "A Lexus RC 350 is a head-turner that backs up the looks with 306 horsepower and Lexus build quality. This one finished in black over rich brown leather, the Premium Package with blind-spot monitor, navigation, moonroof, and the kind of fit and finish that makes every drive feel like something. 135,116 miles on a 3.5L V6 that's proven to run well past 250,000 with care. CarGurus rates this listing a Great Deal. Carefully selected, fully reconditioned, and ready at our Villa Park lot. $17,999. Call or text (630) 359-3643 to test drive.",
    features: [
      "3.5L V6 (306 HP)",
      "Premium Package",
      "Blind Spot Monitor",
      "Navigation System",
      "Brown Leather Interior",
      "Bluetooth & SiriusXM",
      "Safety Connect",
      "Daytime Running Lights",
      "Power Moonroof",
      "8-Speed Automatic",
    ],
    images: generateImagePaths("2016-lexus-rc-350-2d", 2016, "lexus", "rc", 24),
    status: "available",
    dateInStock: "2025-08-18",
    daysOnLot: 243,
  },
  {
    id: "11262",
    slug: "2008-saab-9-3-convertible-11262",
    vin: "YS3FB79Y886005860",
    stockNumber: "11262",
    year: 2008,
    make: "Saab",
    model: "9-3",
    trim: "2.0T",
    price: 2499,
    mileage: 192389,
    exteriorColor: "Gray",
    interiorColor: "Gray Leather",
    drivetrain: "FWD",
    transmission: "Automatic with Sentronic",
    engine: "2.0L 4-Cylinder Turbo",
    bodyStyle: "Convertible",
    fuelType: "Gasoline",
    description:
      "A Saab convertible isn't something you see every day, and at $2,499, it's an affordable way to enjoy top-down driving this summer. The 2.0T turbocharged engine delivers spirited performance, the leather interior is comfortable, and the power roof folds away for open-air cruising. Fog lights, cruise control, rollover protection, and AM/FM/XM satellite. 192,389 miles, thoroughly inspected, and priced to move to whoever appreciates something different. Call or text (630) 359-3643 to see it at 735 N Yale Ave, Villa Park.",
    features: [
      "2.0L Turbo Engine",
      "Power Convertible Top",
      "Leather Seats",
      "Cruise Control",
      "Fog Lights",
      "Rollover Protection",
      "Power Windows & Locks",
      "Air Conditioning",
      "AM/FM/XM Satellite",
      "ABS Brakes",
    ],
    images: generateImagePaths("2008-saab-9-3-2d", 2008, "saab", "9-3", 23),
    // Sold per DealerCenter sold-vehicles report; flipped to "sold"
    // Apr 23 2026 during the same audit that caught the Honda Pilot.
    status: "sold",
    dateInStock: "2025-06-23",
    daysOnLot: 299,
  },
];

export function getVehicleBySlug(slug: string): Vehicle | undefined {
  return sampleInventory.find((v) => v.slug === slug);
}

export function getFilteredInventory(filters: {
  make?: string;
  minPrice?: number;
  maxPrice?: number;
  maxMileage?: number;
  bodyStyle?: string;
  sortBy?: string;
}): Vehicle[] {
  let results = sampleInventory.filter((v) => v.status === "available");

  if (filters.make) {
    results = results.filter(
      (v) => v.make.toLowerCase() === filters.make!.toLowerCase()
    );
  }
  if (filters.minPrice) {
    results = results.filter((v) => v.price >= filters.minPrice!);
  }
  if (filters.maxPrice) {
    results = results.filter((v) => v.price <= filters.maxPrice!);
  }
  if (filters.maxMileage) {
    results = results.filter((v) => v.mileage <= filters.maxMileage!);
  }
  if (filters.bodyStyle) {
    results = results.filter(
      (v) => v.bodyStyle.toLowerCase() === filters.bodyStyle!.toLowerCase()
    );
  }

  switch (filters.sortBy) {
    case "price-asc":
      results.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      results.sort((a, b) => b.price - a.price);
      break;
    case "mileage-asc":
      results.sort((a, b) => a.mileage - b.mileage);
      break;
    case "newest":
      results.sort((a, b) => b.year - a.year);
      break;
    case "recent":
    default:
      results.sort((a, b) => a.daysOnLot - b.daysOnLot);
      break;
  }

  return results;
}
