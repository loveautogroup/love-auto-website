"use client";

/**
 * VehiclePicker — "Which vehicle are you applying for?"
 *
 * A dropdown of the cars we actually hold, fed by useInventory() (Cloudflare
 * KV, so it works while Railway is cold), hiding anything merchandising has
 * hidden, and preselecting the car a VDP apply link pointed at. Choosing a
 * car hands the form the real VIN / stock / year / make / model / price;
 * choosing "Another vehicle" reveals the free-text box that used to be the
 * only option. See vehiclePickerOptions.ts for why.
 *
 * The preselect is DERIVED, not set in an effect: the user's explicit choice
 * (state) wins; until they choose, the select shows the link's car if it is
 * still pickable. The one side effect — telling the form about that car —
 * runs once, guarded by a ref, so the parent gets the ident without this
 * component setting its own state inside an effect.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useInventory } from "@/lib/useInventory";
import { useVisibleVehicles } from "@/data/useMerchandising";
import {
  findPreselect,
  optionLabel,
  pickable,
  toPicked,
  type PickedVehicle,
} from "./vehiclePickerOptions";

export const OTHER_VEHICLE = "__other__";

export interface VehiclePickerLabels {
  pick: string;
  placeholder: string;
  other: string;
  loading: string;
  salePending: string;
  otherText: string;
  otherPlaceholder: string;
}

interface Props {
  labels: VehiclePickerLabels;
  /** From the VDP apply link, if any. */
  initialStock?: string | null;
  initialVin?: string | null;
  /** The free-text description the form owns. */
  otherText: string;
  onOtherText: (text: string) => void;
  /** Fires with the chosen car, or null for "another vehicle" / nothing yet. */
  onPick: (picked: PickedVehicle | null) => void;
  className: string;
}

export default function VehiclePicker({
  labels,
  initialStock,
  initialVin,
  otherText,
  onOtherText,
  onPick,
  className,
}: Props) {
  const { vehicles, loading } = useInventory();
  const visible = useVisibleVehicles(vehicles);
  const options = useMemo(() => pickable(visible), [visible]);

  // null = the user has not chosen; a VIN = that car; OTHER_VEHICLE = free text.
  const [choice, setChoice] = useState<string | null>(null);
  const linkHit = useMemo(
    () => findPreselect(options, { stock: initialStock, vin: initialVin }),
    [options, initialStock, initialVin],
  );
  const effectiveChoice = choice ?? linkHit?.vin ?? "";

  // Tell the form about the link's car exactly once, after inventory loads.
  const announcedRef = useRef<string | null>(null);
  useEffect(() => {
    if (choice !== null || !linkHit) return;
    if (announcedRef.current === linkHit.vin) return;
    announcedRef.current = linkHit.vin;
    onPick(toPicked(linkHit, optionLabel(linkHit, labels.salePending)));
    // onPick and labels are stable for the life of the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choice, linkHit]);

  const handleChange = (value: string) => {
    setChoice(value);
    if (value === OTHER_VEHICLE || value === "") {
      onPick(null);
      return;
    }
    const v = options.find((o) => o.vin === value);
    onPick(v ? toPicked(v, optionLabel(v, labels.salePending)) : null);
  };

  return (
    <div className="space-y-3">
      <div>
        <span className="block text-sm font-medium text-brand-gray-900 mb-1">{labels.pick}</span>
        <select
          name="vehiclePick"
          className={className}
          value={effectiveChoice}
          onChange={(e) => handleChange(e.target.value)}
          aria-label={labels.pick}
        >
          <option value="">{loading && options.length === 0 ? labels.loading : labels.placeholder}</option>
          {options.map((v) => (
            <option key={v.vin} value={v.vin}>
              {optionLabel(v, labels.salePending)}
            </option>
          ))}
          <option value={OTHER_VEHICLE}>{labels.other}</option>
        </select>
      </div>
      {effectiveChoice === OTHER_VEHICLE && (
        <div>
          <span className="block text-sm font-medium text-brand-gray-900 mb-1">{labels.otherText}</span>
          <input
            type="text"
            name="vehicleOtherText"
            placeholder={labels.otherPlaceholder}
            className={className}
            value={otherText}
            onChange={(e) => onOtherText(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
