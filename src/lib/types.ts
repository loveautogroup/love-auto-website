export interface Vehicle {
  id: string;
  slug: string;
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
  drivetrain: string;
  transmission: string;
  engine: string;
  bodyStyle: string;
  fuelType: string;
  description: string;
  features: string[];
  images: string[];
  status: "available" | "sale-pending" | "sold";
  dateInStock: string;
  daysOnLot: number;
}

export interface ContactFormData {
  name: string;
  phone: string;
  email: string;
  message: string;
  vehicleOfInterest?: string;
}

export interface FinancingFormData {
  name: string;
  phone: string;
  email: string;
  vehicleOfInterest?: string;
  creditScore: string;
  monthlyBudget: string;
}

export interface TradeInFormData {
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleTrim: string;
  vehicleMileage: string;
  condition: "excellent" | "good" | "fair" | "poor";
  name: string;
  phone: string;
  email: string;
}
