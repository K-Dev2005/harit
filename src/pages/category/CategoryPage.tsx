import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EMISSION_FACTORS } from '../../lib/emissionFactors';
import { Entry } from '../../types';
import { useAddEntry } from '../../context/AddEntryContext';

const DEFAULT_USER_ID = 'user_001';

interface SubcategoryData {
  name: string;
  co2Kg: number;
  proportion: number;
  tip: string;
}

const categoryTips: Record<string, string> = {
  'petrol cab': 'Switch to Electric Cabs to reduce emissions by 66%.',
  'ola': 'Select electric rides when booking cabs.',
  'uber': 'Choose Uber Green or electric options where available.',
  'auto-rickshaw': 'Auto-rickshaws are efficient! Try sharing when possible.',
  'personal petrol car': 'Carpool or use the metro to save up to 90% emissions.',
  'electric cab': 'Electric cabs are clean. Combined with renewable charging, they approach zero emissions.',
  'metro': 'Metro is your greenest transit option. Try to make it your primary commute.',
  'bus (city)': 'Buses are highly efficient. Using public transit keeps cities cleaner.',
  'train - sleeper (sl)': 'Long distance trains are excellent green alternatives to flights.',
  'train - 3a': 'Trains emit only a fraction of flight carbon.',
  'train - 2a': 'Trains are low carbon travel options.',
  'train - chair car (cc)': 'Short distance trains are extremely efficient.',
  'flight (economy)': 'Flights have massive radiative forcing. Consider trains for domestic routes.',
  'non-veg meal': 'Swapping 1 non-veg meal for a veg meal saves 1.8 kg CO2e.',
  'veg meal': 'Try vegan meals occasionally to reduce food emissions by 40%.',
  'vegan meal': 'Vegan meals have the lowest footprint. You\'re doing great!',
  'food delivery packaging': 'Ordering in adds packaging waste. Dine in or cook at home.',
  'ac': 'Raise your AC temperature to 24°C to save energy and reduce emissions.',
  'shopping': 'Buy pre-loved items or extend product life to lower stuff impact.'
};

const defaultCategoryMocks: Record<string, { total: number; subcategories: SubcategoryData[] }> = {
  transport: {
    total: 18.4,
    subcategories: [
      { name: 'petrol cab', co2Kg: 12.6, proportion: 68.5, tip: 'Switch to Electric Cabs to reduce emissions by 66%.' },
      { name: 'personal petrol car', co2Kg: 4.2, proportion: 22.8, tip: 'Carpool or use the metro to save up to 90% emissions.' },
      { name: 'metro', co2Kg: 1.2, proportion: 6.5, tip: 'Metro is your greenest transit option. Try to make it your primary commute.' },
      { name: 'auto-rickshaw', co2Kg: 0.4, proportion: 2.2, tip: 'Auto-rickshaws are efficient! Try sharing when possible.' }
    ]
  },
  food: {
    total: 12.6,
    subcategories: [
      { name: 'non-veg meal', co2Kg: 9.0, proportion: 71.4, tip: 'Swapping 1 non-veg meal for a veg meal saves 1.8 kg CO2e.' },
      { name: 'veg meal', co2Kg: 2.4, proportion: 19.0, tip: 'Try vegan meals occasionally to reduce food emissions by 40%.' },
      { name: 'vegan meal', co2Kg: 0.7, proportion: 5.6, tip: 'Vegan meals have the lowest footprint. You\'re doing great!' },
      { name: 'food delivery packaging', co2Kg: 0.5, proportion: 4.0, tip: 'Ordering in adds packaging waste. Dine in or cook at home.' }
    ]
  },
  home: {
    total: 5.2,
    subcategories: [
      { name: 'ac', co2Kg: 5.2, proportion: 100.0, tip: 'Raise your AC temperature to 24°C to save energy and reduce emissions.' }
    ]
  },
  stuff: {
    total: 2.2,
    subcategories: [
      { name: 'shopping', co2Kg: 2.2, proportion: 100.0, tip: 'Buy pre-loved items or extend product life to lower stuff impact.' }
    ]
  }
};

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const activeCategory = slug || 'transport';
  const { openSheet, setPrefillData } = useAddEntry();

  const [totalKg, setTotalKg] = useState(0);
  const [subcategories, setSubcategories] = useState<SubcategoryData[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCategoryData = async () => {
    try {
      const res = await fetch(`/api/entries?userId=${DEFAULT_USER_ID}&category=${activeCategory}`);
      if (res.ok) {
        const json = await res.json();
        const entries: Entry[] = json.entries || [];
        
        if (entries.length > 0) {
          // Calculate subcategory aggregates
          const groups: Record<string, number> = {};
          let total = 0;
          entries.forEach(e => {
            const sub = e.subcategory || 'general';
            groups[sub] = (groups[sub] || 0) + e.co2Kg;
            total += e.co2Kg;
          });

          const subList: SubcategoryData[] = Object.keys(groups).map(name => {
            const co2 = groups[name];
            return {
              name,
              co2Kg: co2,
              proportion: total > 0 ? (co2 / total) * 100 : 0,
              tip: categoryTips[name] || `Try to minimize usage in ${name} category.`
            };
          }).sort((a, b) => b.co2Kg - a.co2Kg);

          setTotalKg(total);
          setSubcategories(subList);
        } else {
          // Use mocks if no entries logged yet
          const mock = defaultCategoryMocks[activeCategory] || defaultCategoryMocks.transport;
          setTotalKg(mock.total);
          setSubcategories(mock.subcategories);
        }
      } else {
        const mock = defaultCategoryMocks[activeCategory] || defaultCategoryMocks.transport;
        setTotalKg(mock.total);
        setSubcategories(mock.subcategories);
      }
    } catch (e) {
      console.warn("Using mock category data:", e);
      const mock = defaultCategoryMocks[activeCategory] || defaultCategoryMocks.transport;
      setTotalKg(mock.total);
      setSubcategories(mock.subcategories);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryData();

    const handleEntrySaved = () => {
      fetchCategoryData();
    };

    window.addEventListener('entry-saved', handleEntrySaved);

    return () => {
      window.removeEventListener('entry-saved', handleEntrySaved);
    };
  }, [activeCategory]);

  const toggleRow = (name: string) => {
    setExpandedRow(expandedRow === name ? null : name);
  };



  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-md text-body-md text-on-surface-variant font-medium">Analyzing category details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background pb-[80px] md:pb-0 md:pl-64">
      {/* Header */}
      <header className="flex items-center gap-md w-full px-lg py-md border-b bg-surface-container-lowest border-surface-variant max-w-container-max mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-xs text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <div>
          <h1 className="text-headline-md font-semibold text-primary capitalize font-sans">{activeCategory}</h1>
          <p className="text-[11px] text-on-surface-variant uppercase tracking-wider">Category Deep-Dive</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-md md:p-xl max-w-[800px] w-full mx-auto space-y-lg">
        
        {/* Large Metric */}
        <section className="bg-surface-container-lowest border border-surface-variant rounded-lg p-lg text-center shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
          <span className="font-semibold text-label-sm text-on-surface-variant uppercase tracking-widest block mb-xs">
            This Month's Impact
          </span>
          <span className="text-[52px] font-extrabold text-primary leading-none tracking-tighter block my-sm">
            {totalKg.toFixed(1)} <span className="text-body-lg font-semibold text-on-surface-variant">kg CO2e</span>
          </span>
          <p className="text-xs text-on-surface-variant mt-sm">
            Based on all logged activities in {activeCategory} this month.
          </p>
        </section>

        {/* Sub-driver List */}
        <section className="bg-surface-container-lowest border border-surface-variant rounded-lg p-lg shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
          <h2 className="font-semibold text-body-lg text-primary mb-md border-b border-surface-variant pb-xs">
            Sub-category Breakdown
          </h2>

          <div className="space-y-sm">
            {subcategories.map((sub) => {
              const isExpanded = expandedRow === sub.name;
              return (
                <div
                  key={sub.name}
                  onClick={() => toggleRow(sub.name)}
                  className="p-sm hover:bg-surface-container-low rounded-md border border-transparent hover:border-surface-variant cursor-pointer transition-all duration-200"
                >
                  <div className="flex justify-between items-center mb-xs">
                    <span className="text-[13px] font-semibold text-primary capitalize">{sub.name}</span>
                    <span className="text-[13px] font-medium text-on-surface-variant">{sub.co2Kg.toFixed(1)} kg</span>
                  </div>

                  {/* Proportion mini-bar */}
                  <div className="w-full h-[6px] bg-surface-container rounded-full overflow-hidden mb-1">
                    <div
                      style={{ width: `${sub.proportion}%` }}
                      className="h-full bg-secondary-container"
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-on-surface-variant mt-1">
                    <span>{sub.proportion.toFixed(0)}% of category</span>
                    <span className="material-symbols-outlined text-[14px]">
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>

                  {/* Expanded tip */}
                  {isExpanded && (
                    <div className="mt-sm p-sm bg-primary/5 border border-primary/10 rounded-md text-xs text-primary font-medium animate-fade-in flex items-start gap-xs">
                      <span className="material-symbols-outlined text-[16px] mt-0.5 text-secondary">tips_and_updates</span>
                      <div>
                        <span className="font-semibold text-secondary block mb-0.5">Quick Impact Recommendation:</span>
                        {sub.tip}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="pt-md">
          <button
            onClick={() => {
              setPrefillData({ category: activeCategory });
              openSheet('manual');
            }}
            className="w-full py-sm bg-primary-container text-white rounded-full font-semibold text-xs hover:opacity-95 transition-all shadow-[0_4px_15px_rgba(0,0,0,0.05)] flex items-center justify-center gap-xs"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Log an entry in this category
          </button>
        </section>
      </main>


    </div>
  );
};
export default CategoryPage;
