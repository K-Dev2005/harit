import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconTree, IconCar } from '@tabler/icons-react';

export default function ResultPage() {
  const navigate = useNavigate();
  const [baselineTonnes, setBaselineTonnes] = useState<number>(0);

  useEffect(() => {
    try {
      const answersStr = localStorage.getItem('harit_quiz_answers');
      if (!answersStr) {
        navigate('/quiz');
        return;
      }
      
      const answers = JSON.parse(answersStr);

      const commuteFactors: Record<string, number> = { walk: 0, public: 0.5, car: 1.8, wfh: 0 };
      const dietFactors: Record<string, number> = { vegan: 255, veg: 437, meat_some: 730, meat_daily: 1095 };
      const homeFactors: Record<string, number> = { solar: 100, grid: 600, lpg: 400, biomass: 300 };
      const flightFactors: Record<string, number> = { none: 0, one_two: 400, three_five: 1100, six_plus: 2400 };

      const commuteKg = (commuteFactors[answers.commute] || 0) * 240 * 10;
      const dietKg = dietFactors[answers.diet] || 0;
      const homeKg = homeFactors[answers.home] || 0;
      const flightsKg = flightFactors[answers.flights] || 0;

      const totalKg = commuteKg + dietKg + homeKg + flightsKg;
      setBaselineTonnes(totalKg / 1000);
    } catch (e) {
      console.error(e);
      navigate('/quiz');
    }
  }, [navigate]);

  if (baselineTonnes === 0) return null;

  const comparisons = [
    { label: 'You', value: baselineTonnes, color: 'bg-primary' },
    { label: 'Paris 2050', value: 2.0, color: 'bg-secondary' },
    { label: 'India avg', value: 1.9, color: 'bg-outline-variant' },
    { label: 'Global avg', value: 4.7, color: 'bg-outline' },
  ];

  const maxVal = Math.max(...comparisons.map(c => c.value));

  const treesNeeded = Math.round(baselineTonnes * 20);
  const kmInCar = Math.round(baselineTonnes * 4390);

  return (
    <div className="flex flex-col min-h-screen bg-background p-lg max-w-[600px] mx-auto">
      <div className="flex-1 flex flex-col justify-center gap-xl">
        
        {/* Big Number */}
        <div className="text-center">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-sm">Your Annual Footprint</p>
          <div className="text-[64px] font-bold leading-none tracking-[-0.04em] text-primary">
            {baselineTonnes.toFixed(1)} <span className="text-[32px] text-on-surface-variant">t</span>
          </div>
          <p className="text-body-md text-on-surface-variant mt-xs">CO₂e per year</p>
        </div>

        {/* Metaphors */}
        <div className="flex flex-col gap-sm">
          <div className="flex items-center gap-sm bg-surface-container-lowest border border-outline-variant rounded-lg p-md">
            <div className="p-xs bg-primary-container/20 text-primary rounded-md">
              <IconTree size={20} />
            </div>
            <span className="text-body-md text-on-surface font-medium">
              = {treesNeeded.toLocaleString()} trees needed annually
            </span>
          </div>
          <div className="flex items-center gap-sm bg-surface-container-lowest border border-outline-variant rounded-lg p-md">
            <div className="p-xs bg-surface-container text-on-surface-variant rounded-md">
              <IconCar size={20} />
            </div>
            <span className="text-body-md text-on-surface font-medium">
              = {kmInCar.toLocaleString()} km in a petrol car
            </span>
          </div>
        </div>

        {/* Comparison Bars */}
        <div className="bg-surface border border-outline-variant rounded-lg p-lg flex flex-col gap-md">
          {comparisons.map(comp => (
            <div key={comp.label} className="flex flex-col gap-xs">
              <div className="flex justify-between items-end">
                <span className={`text-label-sm ${comp.label === 'You' ? 'font-bold text-primary' : 'text-on-surface-variant'}`}>
                  {comp.label}
                </span>
                <span className={`text-body-md font-semibold ${comp.label === 'You' ? 'text-primary' : 'text-on-surface'}`}>
                  {comp.value.toFixed(1)}t
                </span>
              </div>
              <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${comp.color}`}
                  style={{ width: `${(comp.value / maxVal) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-xl pb-xl">
        <button 
          onClick={() => navigate('/signin')}
          className="w-full bg-primary text-white font-semibold py-md rounded-md hover:bg-primary/90 transition-colors"
        >
          Save my results — create account
        </button>
      </div>
    </div>
  );
}
