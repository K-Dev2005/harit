import React from 'react';
import { Entry } from '../../../types';

interface RecentEntriesProps {
  entries: Entry[];
  onSelectEntry: (entry: Entry) => void;
}

export const RecentEntries: React.FC<RecentEntriesProps> = ({
  entries,
  onSelectEntry,
}) => {
  return (
    <section className="bg-surface-container-lowest border border-surface-variant rounded-lg p-lg shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
      <div className="flex justify-between items-center mb-md border-b border-surface-variant/40 pb-xs">
        <h2 className="font-semibold text-body-lg text-primary">Recent entries</h2>
        <button className="text-secondary font-semibold text-xs hover:underline">See all</button>
      </div>

      <div className="divide-y divide-surface-container-low">
        {entries.length === 0 ? (
          <p className="text-center py-md text-xs text-on-surface-variant">No entries recorded yet.</p>
        ) : (
          entries.slice(0, 5).map((entry) => {
            let icon = 'directions_car';
            let iconBg = 'bg-secondary-container text-on-secondary-container';
            if (entry.category === 'food') {
              icon = 'restaurant';
              iconBg = 'bg-tertiary-container text-[#aeeecb]'; // customized
            } else if (entry.category === 'home') {
              icon = 'bolt';
              iconBg = 'bg-[#ffdad6] text-[#ba1a1a]';
            } else if (entry.category === 'stuff') {
              icon = 'shopping_bag';
              iconBg = 'bg-surface-container text-primary';
            }

            return (
              <div
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                className="flex items-center justify-between py-sm cursor-pointer group hover:bg-surface-container-lowest transition-colors px-1"
              >
                <div className="flex items-center gap-sm">
                  <div className={`w-10 h-10 rounded-md flex items-center justify-center ${iconBg}`}>
                    <span className="material-symbols-outlined text-[20px]">{icon}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-primary group-hover:text-secondary transition-colors">
                      {entry.description}
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      {entry.subcategory || entry.category} • {entry.loggedAt ? 'Today' : 'Yesterday'}
                    </span>
                  </div>
                </div>
                <span className="text-[13px] font-medium text-on-surface-variant">
                  {entry.co2Kg.toFixed(1)} kg
                </span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
