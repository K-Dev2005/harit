import React from 'react';
import { Entry } from '../../../types';

interface EntryDetailSheetProps {
  entry: Entry;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export const EntryDetailSheet: React.FC<EntryDetailSheetProps> = ({
  entry,
  onClose,
  onDelete,
}) => {
  return (
    <div className="fixed inset-0 bg-primary/20 backdrop-blur-[2px] z-50 flex items-end justify-center">
      <div className="bg-surface-container-lowest w-full max-w-[500px] rounded-t-lg p-lg space-y-md shadow-[0_-5px_30px_rgba(0,0,0,0.15)] animate-slide-up">
        <div className="flex justify-between items-start border-b border-surface-variant pb-sm">
          <div>
            <h3 className="font-semibold text-body-lg text-primary">{entry.description}</h3>
            <p className="text-[12px] text-on-surface-variant capitalize">{entry.category} • {entry.subcategory || 'General'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-xs text-on-surface-variant hover:bg-surface-container rounded-full"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-sm py-xs">
          <div className="flex justify-between">
            <span className="text-xs text-on-surface-variant">Carbon Footprint</span>
            <span className="text-xs font-semibold text-primary">{entry.co2Kg.toFixed(1)} kg CO2e</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-on-surface-variant">Logged Source</span>
            <span className="text-xs font-medium text-primary capitalize">{entry.source}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-on-surface-variant">Date logged</span>
            <span className="text-xs font-medium text-primary">
              {new Date(entry.loggedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            </span>
          </div>
        </div>

        <div className="flex gap-sm border-t border-surface-variant pt-md">
          <button
            onClick={() => onDelete(entry.id)}
            className="flex-1 py-sm bg-[#dc2626] text-white rounded-full font-semibold text-xs hover:bg-[#b91c1c] transition-colors"
          >
            Delete Entry
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-sm border border-outline-variant text-primary rounded-full font-semibold text-xs hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
