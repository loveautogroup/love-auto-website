// ============================================================================
// Love Auto Group - Sample Vehicle Inventory Data
// ============================================================================

export interface Vehicle {
  id: number;
  slug: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  price: number;
  mileage: number;
  exteriorColor: string;
  interiorColor: string;
  drivetrain: string;
  transmission: string;
  engine: string;
  vin: string;
  stockNumber: string;
  bodyStyle: string;
  fuelType: string;
  features: string[];
  description: string;
  status: string;
}

export const vehicles: Vehicle[] = [
  {
    id: 1,
    slug: "2016-honda-pilot-ex-l",
    year: 2016,
    make: "Honda",
    model: "Pilot",
    trim: "EX-L",
    price: 14995,
    mileage: 89000,
    exteriorColor: "Silver",
    interiorColor: "Gray",
    drivetrain: "AWD",
    transmission: "6-Speed Automatic",
    engine: "3.5L V6",
    vin: "5FNYF5H59GB012345",
    stockNumber: "LAG1001",
    bodyStyle: "SUV",
    fuelType: "Gasoline",
    features: [
      "Leather Seats",
      "Sunroof",
      "Heated Front Seats",
      "Backup Camera",
      "Bluetooth",
      "Third Row Seating",
      "Apple CarPlay",
      "Lane Departure Warning",
    ],
    description:
      "Well-maintained 2016 Honda Pilot EX-L with all-wheel drive. This family-friendly SUV features leather seating, a power sunroof, and Honda Sensing safety suite. Third row seating makes it perfect for larger families. Clean title, no accidents.",
    status: "Available",
  },
  {
    id: 2,
    slug: "2017-ford-mustang-ecoboost",
    year: 2017,
    make: "Ford",
    model: "Mustang",
    trim: "EcoBoost",
    price: 15500,
    mileage: 67000,
    exteriorColor: "Red",
    interiorColor: "Black",
    drivetrain: "RWD",
    transmission: "6-Speed Manual",
    engine: "2.3L Turbocharged I4",
    vin: "1FA6P8TH5H5234567",
    stockNumber: "LAG1002",
    bodyStyle: "Coupe",
    fuelType: "Gasoline",
    features: [
      "Turbocharged Engine",
      "SYNC 3 Infotainment",
      "Backup Camera",
      "Bluetooth",
      "Performance Package",
      "Keyless Entry",
      "Dual Exhaust",
      "Sport Mode",
    ],
    description:
      "Head-turning 2017 Ford Mustang EcoBoost in Race Red with a 6-speed manual transmission. The turbocharged 2.3L engine delivers thrilling performance with better fuel economy than the V8. Fun to drive every day.",
    status: "Available",
  },
  {
    id: 3,
    slug: "2016-lexus-rc-200t",
    year: 2016,
    make: "Lexus",
    model: "RC",
    trim: "200t",
    price: 17995,
    mileage: 72000,
    exteriorColor: "White",
    interiorColor: "Red",
    drivetrain: "RWD",
    transmission: "8-Speed Automatic",
    engine: "2.0L Turbocharged I4",
    vin: "JTHHA5BC0G5008765",
    stockNumber: "LAG1003",
    bodyStyle: "Coupe",
    fuelType: "Gasoline",
    features: [
      "Luxury Package",
      "Navigation",
      "Leather Seats",
      "Heated & Ventilated Seats",
      "Mark Levinson Audio",
      "Sunroof",
      "Blind Spot Monitor",
      "Adaptive Cruise Control",
    ],
    description:
      "Stunning 2016 Lexus RC 200t luxury coupe in Ultra White with Rioja Red leather interior. Loaded with the Luxury Package including Mark Levinson premium audio and navigation. Lexus reliability meets sport coupe styling.",
    status: "Available",
  },
  {
    id: 4,
    slug: "2013-gmc-terrain-sle",
    year: 2013,
    make: "GMC",
    model: "Terrain",
    trim: "SLE",
    price: 8995,
    mileage: 112000,
    exteriorColor: "Black",
    interiorColor: "Gray",
    drivetrain: "FWD",
    transmission: "6-Speed Automatic",
    engine: "2.4L I4",
    vin: "2GKFLRE33D6298765",
    stockNumber: "LAG1004",
    bodyStyle: "SUV",
    fuelType: "Gasoline",
    features: [
      "Backup Camera",
      "Bluetooth",
      "OnStar",
      "Power Windows",
      "Power Locks",
      "Cruise Control",
      "Alloy Wheels",
      "Roof Rails",
    ],
    description:
      "Affordable 2013 GMC Terrain SLE with great fuel economy from the 2.4L engine. Spacious interior, backup camera, and Bluetooth connectivity. Perfect daily commuter SUV at an unbeatable price.",
    status: "Available",
  },
  {
    id: 5,
    slug: "2017-hyundai-accent-se",
    year: 2017,
    make: "Hyundai",
    model: "Accent",
    trim: "SE",
    price: 7500,
    mileage: 85000,
    exteriorColor: "Blue",
    interiorColor: "Gray",
    drivetrain: "FWD",
    transmission: "6-Speed Automatic",
    engine: "1.6L I4",
    vin: "KMHCT4AE8HU345678",
    stockNumber: "LAG1005",
    bodyStyle: "Sedan",
    fuelType: "Gasoline",
    features: [
      "Bluetooth",
      "USB Port",
      "Power Windows",
      "Air Conditioning",
      "Cruise Control",
      "Keyless Entry",
      "AM/FM/CD",
      "Traction Control",
    ],
    description:
      "Budget-friendly 2017 Hyundai Accent SE sedan. Excellent gas mileage and low maintenance costs make this the perfect first car or commuter vehicle. Bluetooth, cruise control, and power windows included.",
    status: "Available",
  },
  {
    id: 6,
    slug: "2019-subaru-forester-limited",
    year: 2019,
    make: "Subaru",
    model: "Forester",
    trim: "Limited",
    price: 18995,
    mileage: 65000,
    exteriorColor: "Silver",
    interiorColor: "Brown",
    drivetrain: "AWD",
    transmission: "CVT",
    engine: "2.5L Flat-4",
    vin: "JF2SJARC3KH456789",
    stockNumber: "LAG1006",
    bodyStyle: "SUV",
    fuelType: "Gasoline",
    features: [
      "EyeSight Driver Assist",
      "Leather Seats",
      "Panoramic Sunroof",
      "Heated Seats",
      "Navigation",
      "Apple CarPlay",
      "Android Auto",
      "Power Liftgate",
    ],
    description:
      "2019 Subaru Forester Limited with Subaru's legendary Symmetrical AWD. Loaded with EyeSight driver assist technology, leather seats, panoramic sunroof, and navigation. Top safety ratings make it ideal for Illinois winters.",
    status: "Available",
  },
  {
    id: 7,
    slug: "2018-toyota-camry-se",
    year: 2018,
    make: "Toyota",
    model: "Camry",
    trim: "SE",
    price: 13500,
    mileage: 78000,
    exteriorColor: "Gray",
    interiorColor: "Black",
    drivetrain: "FWD",
    transmission: "8-Speed Automatic",
    engine: "2.5L I4",
    vin: "4T1B11HK0JU567890",
    stockNumber: "LAG1007",
    bodyStyle: "Sedan",
    fuelType: "Gasoline",
    features: [
      "Toyota Safety Sense",
      "Entune 3.0",
      "Backup Camera",
      "Bluetooth",
      "Dual Zone Climate",
      "Sport-Tuned Suspension",
      "LED Headlights",
      "Keyless Start",
    ],
    description:
      "Redesigned 2018 Toyota Camry SE with sportier styling and the smooth 8-speed automatic transmission. Toyota Safety Sense comes standard including pre-collision braking and lane departure alert. Legendary Toyota reliability.",
    status: "Available",
  },
  {
    id: 8,
    slug: "2015-acura-mdx-sh-awd",
    year: 2015,
    make: "Acura",
    model: "MDX",
    trim: "SH-AWD",
    price: 16995,
    mileage: 94000,
    exteriorColor: "Black",
    interiorColor: "Tan",
    drivetrain: "AWD",
    transmission: "6-Speed Automatic",
    engine: "3.5L V6",
    vin: "5FRYD4H46FB678901",
    stockNumber: "LAG1008",
    bodyStyle: "SUV",
    fuelType: "Gasoline",
    features: [
      "Super Handling AWD",
      "Leather Seats",
      "Sunroof",
      "Navigation",
      "Heated Seats",
      "Third Row Seating",
      "Power Liftgate",
      "Premium Audio",
    ],
    description:
      "Luxurious 2015 Acura MDX with Super Handling All-Wheel Drive. This premium three-row SUV features leather, navigation, sunroof, and heated seats. Acura's SH-AWD system provides exceptional handling in all weather conditions.",
    status: "Available",
  },
];

export function getVehicleBySlug(slug: string): Vehicle | undefined {
  return vehicles.find((v) => v.slug === slug);
}

export function getAllSlugs(): string[] {
  return vehicles.map((v) => v.slug);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatMileage(mileage: number): string {
  return new Intl.NumberFormat("en-US").format(mileage) + " mi";
}
