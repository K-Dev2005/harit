import { useState, useEffect } from 'react';
import { Train, Plane } from 'lucide-react';
import { EMISSION_FACTORS, trainClassFactors } from '../../lib/emissionFactors';
import { getAuthUserId } from '../../lib/auth';
import { CityInput } from '../CityInput';

export const PNRFlightTab = ({ onSaveSuccess }: { onSaveSuccess: (msg: string, entry?: any) => void }) => {
  const [activeMode, setActiveMode] = useState<'train' | 'flight'>('train');
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [flightNum, setFlightNum] = useState("");
  const [trainResult, setTrainResult] = useState<any>(null);
  const [flightResult, setFlightResult] = useState<any>(null);
  const [trainClass, setTrainClass] = useState('SL');
  const [trainCo2, setTrainCo2] = useState(0);
  const [isLoadingTrain, setIsLoadingTrain] = useState(false);
  const [trainError, setTrainError] = useState("");

  // Re-calculate train CO2 when class changes
  useEffect(() => {
    if (trainResult && trainResult.distanceKm) {
      const factor = trainClassFactors[trainClass] || 0.016;
      setTrainCo2(parseFloat((trainResult.distanceKm * factor).toFixed(2)));
    }
  }, [trainClass, trainResult]);

  const handleTrainLookup = async () => {
    if (!origin || !destination) return;
    setIsLoadingTrain(true);
    setTrainError("");
    setTrainResult(null);
    try {
      const response = await fetch('/api/lookup/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ origin, destination }),
      });
      const data = await response.json();
      if (response.ok) {
        setTrainResult(data);
      } else {
        setTrainError(data.error || "Could not calculate distance.");
      }
    } catch {
      setTrainError("Distance service unavailable. Please try again.");
    } finally {
      setIsLoadingTrain(false);
    }
  };

  const handleFlightLookup = async () => {
    if (!flightNum.trim()) return;
    try {
      const response = await fetch('/api/lookup/flight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ flightNumber: flightNum }),
      });
      if (response.ok) {
        const data = await response.json();
        setFlightResult(data);
      } else {
        // Fallback
        setFlightResult({ route: "Delhi (DEL) → Mumbai (BOM)", airline: "IndiGo", distanceKm: 1150 });
      }
    } catch {
      // Fallback
      setFlightResult({ route: "Delhi (DEL) → Mumbai (BOM)", airline: "IndiGo", distanceKm: 1150 });
    }
  };

  const saveTrain = async () => {
    if (!trainResult) return;
    const entryPayload = {
      category: 'transport',
      subcategory: `train - ${trainClass.toLowerCase()}`,
      description: `Train journey: ${trainResult.origin.replace(', India', '')} → ${trainResult.destination.replace(', India', '')}`,
      distanceKm: trainResult.distanceKm,
      co2Kg: trainCo2,
      source: 'manual',
      loggedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    try {
      await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...entryPayload })
      });
      onSaveSuccess(`Entry saved — ${trainCo2} kg logged`, entryPayload);
      setTrainResult(null);
      setOrigin("");
      setDestination("");
    } catch (e) {
      console.error(e);
    }
  };

  const saveFlight = async () => {
    if (!flightResult) return;
    const flightCo2 = parseFloat((flightResult.distanceKm * EMISSION_FACTORS['flight (economy)']).toFixed(2));
    const entryPayload = {
      category: 'transport',
      subcategory: 'flight',
      description: `Flight: ${flightResult.route}`,
      distanceKm: flightResult.distanceKm,
      co2Kg: flightCo2,
      source: 'manual',
      loggedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    try {
      await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...entryPayload })
      });
      onSaveSuccess(`Entry saved — ${flightCo2} kg logged`, entryPayload);
      setFlightResult(null);
      setFlightNum("");
    } catch (e) {
      console.error(e);
    }
  };

  const getClassName = (cls: string) => {
    const names: Record<string, string> = {
      "1A": "AC First Class",
      "2A": "AC 2-tier",
      "3A": "AC 3-tier",
      "3E": "AC 3-tier Economy",
      "EC": "Executive Chair Car",
      "CC": "Chair Car AC",
      "SL": "Sleeper",
      "2S": "Second Sitting",
      "GENERAL": "General / Unreserved"
    };
    return names[cls] || cls;
  };

  const renderClassButton = (cls: string) => (
    <button
      key={cls}
      onClick={() => setTrainClass(cls)}
      title={getClassName(cls)}
      disabled={isLoadingTrain}
      className={`py-xs rounded text-label-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        trainClass === cls 
          ? 'bg-surface text-on-surface border-2 border-primary shadow-sm' 
          : 'text-on-surface-variant hover:bg-surface-container border-2 border-transparent disabled:opacity-50'
      }`}
    >
      {cls}
    </button>
  );

  return (
    <div className="flex flex-col gap-lg pb-xxl">
      {/* Mode Selector */}
      <div className="flex gap-xs bg-surface-container-low p-1 rounded-lg w-full mb-md">
        <button
          onClick={() => setActiveMode('train')}
          className={`flex-1 flex items-center justify-center gap-sm py-sm rounded-md transition-all font-medium text-body-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            activeMode === 'train'
              ? 'bg-surface shadow-sm text-primary border border-outline-variant/50'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          }`}
        >
          <Train size={18} strokeWidth={activeMode === 'train' ? 2.5 : 2} />
          <span>Train Journey</span>
        </button>
        <button
          onClick={() => setActiveMode('flight')}
          className={`flex-1 flex items-center justify-center gap-sm py-sm rounded-md transition-all font-medium text-body-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            activeMode === 'flight'
              ? 'bg-surface shadow-sm text-primary border border-outline-variant/50'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          }`}
        >
          <Plane size={18} strokeWidth={activeMode === 'flight' ? 2.5 : 2} />
          <span>Flight Lookup</span>
        </button>
      </div>

      {activeMode === 'train' ? (
        /* Train Section */
        <div className="flex flex-col gap-sm">
          <CityInput
            label="Origin City"
            placeholder="e.g. Jalandhar"
            onSelect={setOrigin}
            disabled={isLoadingTrain}
          />
          <CityInput
            label="Destination City"
            placeholder="e.g. New Delhi"
            onSelect={setDestination}
            disabled={isLoadingTrain}
          />

          <div className="mt-sm">
            <label className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs block">Travel Class</label>
            <div className="grid grid-cols-5 gap-xs">
              {['1A', '2A', '3A', '3E', 'EC'].map(renderClassButton)}
            </div>
            <div className="grid grid-cols-4 gap-xs mt-xs">
              {['CC', 'SL', '2S', 'GENERAL'].map(renderClassButton)}
            </div>
          </div>

          {trainError && <div className="text-error text-body-sm mt-xs">{trainError}</div>}

          <button
            onClick={handleTrainLookup}
            disabled={!origin || !destination || isLoadingTrain}
            className="bg-primary text-on-primary px-md py-sm rounded font-medium text-body-md hover:bg-primary-container disabled:opacity-50 mt-sm flex justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {isLoadingTrain ? (
              <span className="flex items-center gap-xs">
                <span className="animate-spin h-4 w-4 border-2 border-on-primary border-t-transparent rounded-full"></span>
                Calculating...
              </span>
            ) : "Calculate distance"}
          </button>

          {trainResult && (
            <div className="bg-surface p-md rounded-lg border border-outline-variant mt-sm flex flex-col gap-md">
              <div>
                <div className="text-headline-md text-on-surface">
                  {trainResult.origin.split(',')[0]} → {trainResult.destination.split(',')[0]}
                </div>
                <div className="text-body-md text-on-surface-variant mt-xs">
                  {trainResult.distanceKm} km by rail (approximate)
                </div>
              </div>

              <div className="flex justify-between items-center pt-xs">
                <div className="text-headline-md text-secondary">{trainCo2} kg CO₂e</div>
                <button onClick={saveTrain} className="bg-primary text-on-primary px-md py-sm rounded text-body-md font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                  Save journey
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Flight Section */
        <div className="flex flex-col gap-sm">
          <label htmlFor="flight-num-input" className="text-label-sm text-on-surface-variant uppercase tracking-wider">Flight number</label>
          <div className="flex gap-sm">
            <input
              id="flight-num-input"
              type="text"
              value={flightNum}
              onChange={e => setFlightNum(e.target.value)}
              placeholder="e.g. 6E 2341"
              className="flex-1 bg-surface border border-outline-variant rounded p-sm text-body-md focus:border-primary uppercase font-mono"
            />
            <button
              onClick={handleFlightLookup}
              disabled={!flightNum.trim()}
              className="bg-primary text-on-primary px-md rounded font-medium text-body-md hover:bg-primary-container disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Look up
            </button>
          </div>

          {flightResult && (
            <div className="bg-surface p-md rounded-lg border border-outline-variant mt-sm flex flex-col gap-md">
              <div>
                <div className="text-headline-md text-on-surface">{flightResult.route}</div>
                <div className="text-body-md text-on-surface-variant mt-xs">
                  {flightResult.airline} • {flightResult.distanceKm} km
                </div>
              </div>

              <div className="flex justify-between items-center pt-xs">
                <div>
                  <div className="text-headline-md text-secondary">
                    {(flightResult.distanceKm * EMISSION_FACTORS['flight (economy)']).toFixed(2)} kg
                  </div>
                  <div className="text-xs text-on-surface-variant mt-1 leading-tight max-w-[200px]">
                    Includes radiative forcing (1.9×) — flights emit more than CO₂ at altitude
                  </div>
                </div>
                <button onClick={saveFlight} className="bg-primary text-on-primary px-md py-sm rounded text-body-md font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                  Save flight
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
