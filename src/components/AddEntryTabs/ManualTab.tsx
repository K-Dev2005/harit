import { useState, useEffect } from 'react';
import { useAddEntry } from '../../context/AddEntryContext';
import { EMISSION_FACTORS } from '../../lib/emissionFactors';

const CATEGORIES = [
  'Transport — cab / auto',
  'Transport — personal car',
  'Transport — metro / bus',
  'Transport — train',
  'Transport — flight',
  'Food — meal ordered in',
  'Food — cooked at home',
  'Home — AC usage',
  'Home — other appliance',
  'Shopping — item bought',
  'Other'
];

export const ManualTab = ({ onSaveSuccess }: { onSaveSuccess: (msg: string) => void }) => {
  const { prefillData } = useAddEntry();
  
  const [activityType, setActivityType] = useState(CATEGORIES[0]);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("km");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [calculatedCo2, setCalculatedCo2] = useState<number | null>(null);

  // Prefill logic
  useEffect(() => {
    if (prefillData) {
      const cat = prefillData.category?.toLowerCase();
      if (cat === 'transport') {
        setActivityType('Transport — cab / auto');
      } else if (cat === 'food') {
        setActivityType('Food — meal ordered in');
      } else if (cat === 'home') {
        setActivityType('Home — AC usage');
      } else if (cat === 'stuff' || cat === 'shopping') {
        setActivityType('Shopping — item bought');
      }
      
      if (prefillData.distanceKm) {
        setQuantity(prefillData.distanceKm.toString());
        setUnit("km");
      } else if (prefillData.quantity) {
        setQuantity(prefillData.quantity.toString());
        setUnit(prefillData.unit || "meals");
      }
      if (prefillData.description) setNotes(prefillData.description);
      // Reset calculated Co2 to force recalculation
      setCalculatedCo2(null);
    }
  }, [prefillData]);

  // Client-side math
  const calculateCo2 = () => {
    const val = parseFloat(quantity);
    if (isNaN(val) || val <= 0) return 0;

    let factor = 0;
    let flat = 0;

    if (activityType === 'Transport — cab / auto') factor = EMISSION_FACTORS['ola']; // approx 0.21
    else if (activityType === 'Transport — personal car') factor = EMISSION_FACTORS['personal petrol car'];
    else if (activityType === 'Transport — metro / bus') factor = EMISSION_FACTORS['metro'];
    else if (activityType === 'Transport — train') factor = EMISSION_FACTORS['train - sleeper (sl)'];
    else if (activityType === 'Transport — flight') factor = EMISSION_FACTORS['flight (economy)'];
    else if (activityType === 'Food — meal ordered in') {
      factor = EMISSION_FACTORS['non-veg meal']; // fallback average
      flat = EMISSION_FACTORS['food delivery packaging'];
    }
    else if (activityType === 'Food — cooked at home') factor = EMISSION_FACTORS['veg meal'];
    // Defaults for others not strictly defined in brief
    else factor = 1.5; 

    return parseFloat(((val * factor) + flat).toFixed(2));
  };

  const handleAction = async () => {
    if (calculatedCo2 === null) {
      // Calculate phase
      if (!quantity.trim()) return;
      setCalculatedCo2(calculateCo2());
    } else {
      // Save phase
      try {
        await fetch('/api/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: activityType.split(' — ')[0],
            subcategory: activityType.split(' — ')[1] || 'general',
            description: notes || activityType,
            distanceKm: unit === 'km' ? parseFloat(quantity) : undefined,
            quantity: unit !== 'km' ? parseFloat(quantity) : undefined,
            unit: unit !== 'km' ? unit : undefined,
            co2Kg: calculatedCo2,
            source: 'manual',
            loggedAt: new Date(date).toISOString(),
            createdAt: new Date().toISOString()
          })
        });
        onSaveSuccess(`Entry saved — ${calculatedCo2} kg logged`);
        // Reset form
        setCalculatedCo2(null);
        setQuantity("");
        setNotes("");
      } catch (e) {
        console.error("Manual save error", e);
      }
    }
  };

  return (
    <div className="flex flex-col gap-lg pb-xxl">
      <div className="flex flex-col gap-sm">
        <label className="text-label-sm text-on-surface-variant uppercase tracking-wider">Activity type</label>
        <select
          value={activityType}
          onChange={e => {
            setActivityType(e.target.value);
            setCalculatedCo2(null);
          }}
          className="bg-surface border border-outline-variant rounded p-sm text-body-md focus:border-primary w-full"
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-sm">
        <label className="text-label-sm text-on-surface-variant uppercase tracking-wider">Distance or quantity</label>
        <div className="flex gap-sm">
          <input
            type="number"
            value={quantity}
            onChange={e => {
              setQuantity(e.target.value);
              setCalculatedCo2(null);
            }}
            placeholder="0"
            className="flex-1 bg-surface border border-outline-variant rounded p-sm text-body-md focus:border-primary font-mono"
          />
          <select
            value={unit}
            onChange={e => {
              setUnit(e.target.value);
              setCalculatedCo2(null);
            }}
            className="bg-surface border border-outline-variant rounded p-sm text-body-md focus:border-primary w-[100px]"
          >
            <option value="km">km</option>
            <option value="meals">meals</option>
            <option value="kWh">kWh</option>
            <option value="kg">kg</option>
            <option value="hours">hours</option>
            <option value="items">items</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-sm">
        <label className="text-label-sm text-on-surface-variant uppercase tracking-wider">Date</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="bg-surface border border-outline-variant rounded p-sm text-body-md focus:border-primary w-full font-mono"
        />
      </div>

      <div className="flex flex-col gap-sm">
        <label className="text-label-sm text-on-surface-variant uppercase tracking-wider">Notes</label>
        <input
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g. office commute"
          className="bg-surface border border-outline-variant rounded p-sm text-body-md focus:border-primary w-full"
        />
      </div>

      <div className="flex items-center gap-md mt-sm">
        <button
          onClick={handleAction}
          disabled={!quantity}
          className="flex-1 bg-primary text-on-primary py-sm rounded font-medium text-body-md hover:bg-primary-container transition-colors disabled:opacity-50"
        >
          {calculatedCo2 === null ? 'Calculate' : 'Save entry'}
        </button>
        {calculatedCo2 !== null && (
          <div className="text-headline-md text-secondary min-w-[120px] text-right">
            ≈ {calculatedCo2} kg
          </div>
        )}
      </div>
    </div>
  );
};
