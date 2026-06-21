import React from 'react';

interface StatsRowProps {
  monthTotalKg: number;
  streakDays: number;
  friendRank: number | { position: number; total: number };
}

export const StatsRow: React.FC<StatsRowProps> = ({
  monthTotalKg,
  streakDays,
  friendRank,
}) => {
  const rankPosition = typeof friendRank === 'object' ? friendRank.position : friendRank;
  const rankTotal = typeof friendRank === 'object' ? friendRank.total : 5;

  return (
    <section className="grid grid-cols-3 gap-sm">
      <div className="bg-surface-container-low hover:bg-surface-container rounded-md p-md flex flex-col justify-between transition-colors">
        <span className="text-[12px] text-on-surface-variant font-medium tracking-tight">This month</span>
        <span className="text-[20px] md:text-[22px] font-semibold text-primary mt-xs">{monthTotalKg.toFixed(1)} kg</span>
      </div>
      <div className="bg-surface-container-low hover:bg-surface-container rounded-md p-md flex flex-col justify-between transition-colors">
        <span className="text-[12px] text-on-surface-variant font-medium tracking-tight">Streak</span>
        <span className="text-[20px] md:text-[22px] font-semibold text-primary mt-xs">{streakDays} days</span>
      </div>
      <div className="bg-surface-container-low hover:bg-surface-container rounded-md p-md flex flex-col justify-between transition-colors">
        <span className="text-[12px] text-on-surface-variant font-medium tracking-tight">Friend rank</span>
        <span className="text-[20px] md:text-[22px] font-semibold text-primary mt-xs">
          #{rankPosition} of {rankTotal}
        </span>
      </div>
    </section>
  );
};
