/**
 * Vehicle types — shared across the entire site
 */

export interface Vehicle {
  id: string;
  vin: string;
  stockNumber: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  price: number;
  mileage: number;
  exteriorColor: string;
  interiorColor: string;
  drivetrain: 'FWD' | 'RWD' | 'AWD' | '4WD';
  transmission: 'Automatic' | 'Manual' | 'CVT';
  engine: string;
  bodyStyle: 'Sedan' | 'SUV' | 'Truck' | 'Coupe' | 'Hatchback' | 'Minivan' | 'Convertible' | 'Wagon';
  fuelType: 'Gasoline' | 'Diesel' | 'Hybrid' | 'Electric' | 'Plug-In Hybrid';
  doors: number;
  description: string;
  features: string[];
  photos: VehiclePhoto[];
  status: 'available' | 'sale_pending' | 'sold';
  daysOnLot: number;
  dateAdded: string;
  slug: string;
}

export interface VehiclePhoto {
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
}

export interface VehicleFilters {
  make?: string[];
  model?: string[];
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMin?: number;
  mileageMax?: number;
  bodyStyle?: string[];
  drivetrain?: string[];
  color?: string[];
  sortBy?: 'price_asc' | 'price_desc' | 'mileage_asc' | 'year_desc' | 'newest';
}

export interface InventoryStats {
  total: number;
  makes: { name: string; count: number }[];
  priceRange: { min: number; max: number };
  bodyStyles: { name: string; count: number }[];
}

export type VehicleSummary = Pick<
  Vehicle,
  'id' | 'year' | 'make' | 'model' | 'trim' | 'price' | 'mileage' |
  'exteriorColor' | 'drivetrain' | 'bodyStyle' | 'features' | 'status' |
  'daysOnLot' | 'slug'
> & {
  primaryPhoto: string;
};
