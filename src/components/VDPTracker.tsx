'use client';

import { useEffect } from 'react';
import { trackViewVehicle, type VehiclePayload } from '@/lib/analytics';

/**
 * Invisible client component that fires the view_vehicle GA4 event
 * once per VDP page load. Drop it into the server-rendered VDP page.
 */
export default function VDPTracker({ vehicle }: { vehicle: VehiclePayload }) {
  useEffect(() => {
    trackViewVehicle(vehicle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle.vin]);

  return null;
}
