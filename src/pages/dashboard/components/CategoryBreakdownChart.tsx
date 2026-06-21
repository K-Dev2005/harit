import React from 'react';
import { useNavigate } from 'react-router-dom';

interface CategoryBreakdownChartProps {
  breakdown: Record<string, number>;
}

const CATEGORIES = [
  { key: 'transport', label: 'Transport', color: 'bg-secondary', text: 'text-on-secondary' },
  { key: 'food', label: 'Food', color: 'bg-secondary-container', text: 'text-on-secondary-container' },
  { key: 'home', label: 'Home', color: 'bg-primary-container', text: 'text-on-primary-container' },
  { key: 'stuff', label: 'Stuff', color: 'bg-tertiary', text: 'text-on-tertiary' }
];

export const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({
  breakdown,
}) => {
  const navigate = useNavigate();
  const totalBreakdown = Object.values(breakdown).reduce((sum, v) => sum + v, 0) || 1;

  return (
    <section className="bg-surface-container-lowest border border-surface-variant rounded-lg p-lg shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
      <h2 className="font-semibold text-body-lg text-primary mb-md">This month by category</h2>
      
      {/* Stacked Bar Chart */}
      <div className="w-full h-[12px] bg-surface-container rounded-full overflow-hidden flex mb-md">
        {CATEGORIES.map((cat) => {
          const val = breakdown[cat.key] || 0;
          const pct = (val / totalBreakdown) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={cat.key}
              onClick={() => navigate(`/category/${cat.key}`)}
              style={{ width: `${pct}%` }}
              className={`${cat.color} h-full cursor-pointer hover:opacity-90 transition-opacity`}
              title={`${cat.label}: ${val.toFixed(1)} kg (${pct.toFixed(0)}%)`}
            />
          );
        })}
      </div>

      {/* Legend Pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-xs">
        {CATEGORIES.map((cat) => {
          const val = breakdown[cat.key] || 0;
          const pct = (val / totalBreakdown) * 100;
          return (
            <div
              key={cat.key}
              onClick={() => navigate(`/category/${cat.key}`)}
              className="flex items-center gap-xs px-sm py-xs bg-surface-container-low hover:bg-surface-container rounded-full cursor-pointer transition-colors"
            >
              <span className={`w-3 h-3 rounded-full ${cat.color}`} />
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-primary">{cat.label}</span>
                <span className="text-[10px] text-on-surface-variant">{pct.toFixed(0)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
