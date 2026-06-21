import React from 'react';
import { useNavigate } from 'react-router-dom';

interface BudgetRingProps {
  weeklyBudgetKg: number;
  weekCurrentKg: number;
  ringPercentage: number;
}

export const BudgetRing: React.FC<BudgetRingProps> = ({
  weeklyBudgetKg,
  weekCurrentKg,
  ringPercentage,
}) => {
  const navigate = useNavigate();

  const remaining = weeklyBudgetKg - weekCurrentKg;
  const isOver = remaining < 0;

  // SVG calculations
  const r = 80;
  const circumference = 2 * Math.PI * r; // ~502.6
  const percentageClamped = Math.min(100, Math.max(0, ringPercentage));
  const strokeDashoffset = circumference - (percentageClamped / 100) * circumference;

  // Determine Ring Color
  let ringColor = 'stroke-primary'; // Under 80% (green/primary)
  if (weekCurrentKg >= weeklyBudgetKg * 0.8 && weekCurrentKg <= weeklyBudgetKg) {
    ringColor = 'stroke-[#d97706]'; // 80-100% (amber)
  } else if (weekCurrentKg > weeklyBudgetKg) {
    ringColor = 'stroke-[#dc2626]'; // Over budget (red)
  }

  return (
    <section className="bg-surface-container-lowest border border-surface-variant rounded-lg p-lg flex flex-col items-center justify-center relative shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
      <div className="w-full flex justify-between items-center mb-md border-b border-surface-variant/40 pb-sm">
        <span className="font-semibold text-label-sm text-on-surface-variant uppercase tracking-widest">Weekly Budget Tracker</span>
        <div className="flex items-center gap-xs">
          <button 
            onClick={() => navigate('/review')}
            className="text-[11px] text-secondary font-bold hover:underline flex items-center gap-[2px] mr-xs"
          >
            <span className="material-symbols-outlined text-[14px]">history</span>
            View last week
          </button>
          <span className="text-xs bg-surface-container-low px-sm py-xs rounded-full font-medium text-on-surface-variant">
            Limit: {weeklyBudgetKg.toFixed(1)} kg
          </span>
        </div>
      </div>

      <div className="relative w-[200px] h-[200px] my-md">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          <circle
            className="stroke-surface-container-low"
            cx="100"
            cy="100"
            fill="transparent"
            r={r}
            strokeWidth="12"
          />
          <circle
            className={`${ringColor} transition-all duration-1000 ease-out`}
            cx="100"
            cy="100"
            fill="transparent"
            r={r}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[44px] font-extrabold text-primary leading-none tracking-tighter">
            {weekCurrentKg.toFixed(1)}
          </span>
          <span className="text-[11px] font-medium text-on-surface-variant tracking-wider uppercase mt-1">
            kg this week
          </span>
        </div>
      </div>

      <div className="text-center mt-sm">
        {!isOver ? (
          <p className="text-body-md font-semibold text-[#2c694e] flex items-center gap-xs">
            <span className="material-symbols-outlined text-[18px] fill-icon">check_circle</span>
            {remaining.toFixed(1)} kg remaining
          </p>
        ) : (
          <p className="text-body-md font-semibold text-[#dc2626] flex items-center gap-xs">
            <span className="material-symbols-outlined text-[18px]">warning</span>
            {Math.abs(remaining).toFixed(1)} kg over budget
          </p>
        )}
      </div>
    </section>
  );
};
