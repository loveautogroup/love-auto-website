/**
 * Lead / form submission types
 */

export interface ContactLead {
  name: string;
  phone: string;
  email: string;
  message: string;
  vehicleOfInterest?: string;
  source: 'contact_form' | 'vdp_inquiry' | 'test_drive' | 'footer';
}

export interface FinancingLead {
  fullName: string;
  phone: string;
  email: string;
  creditRange: 'excellent' | 'good' | 'fair' | 'poor' | 'no_credit';
  monthlyBudget: string;
  vehicleOfInterest?: string;
  downPayment?: string;
}

export interface TradeInLead {
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  vehicleTrim?: string;
  mileage: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  name: string;
  phone: string;
  email: string;
  photos?: File[];
  comments?: string;
}

export interface TestDriveLead {
  name: string;
  phone: string;
  email: string;
  vehicleId: string;
  preferredDate: string;
  preferredTime: string;
}
