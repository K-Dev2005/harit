import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Train, FileText } from 'lucide-react';
import { useAddEntry, TabType } from '../context/AddEntryContext';
import { AITextTab } from './AddEntryTabs/AITextTab';
import { PNRFlightTab } from './AddEntryTabs/PNRFlightTab';
import { ManualTab } from './AddEntryTabs/ManualTab';

const TABS = [
  { id: 'ai', label: 'AI text', icon: Sparkles },
  { id: 'pnr', label: 'PNR / flight', icon: Train },
  { id: 'manual', label: 'Manual', icon: FileText },
];

export const AddEntrySheet = () => {
  const { isOpen, closeSheet, activeTab, setActiveTab } = useAddEntry();
  const [isVisible, setIsVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  const sheetRef = useRef<HTMLDivElement>(null);

  // Handle mounting animation and visual state
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden'; // prevent background scrolling
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = 'auto';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle drag to dismiss
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    let startY = 0;
    let currentY = 0;

    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };
    
    const onTouchMove = (e: TouchEvent) => {
      currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      if (diff > 0) {
        sheet.style.transform = `translateY(${diff}px)`;
      }
    };
    
    const onTouchEnd = () => {
      const diff = currentY - startY;
      sheet.style.transform = ''; // reset immediately
      if (diff > 150) {
        closeSheet();
      }
    };

    sheet.addEventListener('touchstart', onTouchStart, { passive: true });
    sheet.addEventListener('touchmove', onTouchMove, { passive: true });
    sheet.addEventListener('touchend', onTouchEnd);

    return () => {
      sheet.removeEventListener('touchstart', onTouchStart);
      sheet.removeEventListener('touchmove', onTouchMove);
      sheet.removeEventListener('touchend', onTouchEnd);
    };
  }, [isOpen]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.dispatchEvent(new Event('entry-saved'));
    setTimeout(() => {
      setToastMsg(null);
      closeSheet();
    }, 2000);
  };

  if (!isOpen && !isVisible) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-on-surface transition-opacity duration-300 ${isOpen ? 'opacity-40' : 'opacity-0'}`} 
        onClick={closeSheet}
      />
      
      {/* Bottom Sheet */}
      <div 
        ref={sheetRef}
        className={`relative bg-surface w-full h-[92vh] rounded-t-xl flex flex-col transition-transform duration-300 ease-out shadow-[0px_-4px_20px_rgba(0,0,0,0.04)] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Drag handle */}
        <div className="w-full py-sm flex justify-center cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-outline-variant rounded-full" />
        </div>

        {/* Header / Tabs */}
        <div className="flex w-full px-md pb-xs border-b border-outline-variant">
          <div className="flex gap-xs bg-surface-container-low p-1 rounded-lg w-full">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-xs rounded-md transition-all ${
                    isActive 
                      ? 'bg-surface shadow-sm text-primary border border-outline-variant/50' 
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-lg py-lg">
          {activeTab === 'ai' && <AITextTab onSaveSuccess={showToast} />}
          {activeTab === 'pnr' && <PNRFlightTab onSaveSuccess={showToast} />}
          {activeTab === 'manual' && <ManualTab onSaveSuccess={showToast} />}
        </div>

        {/* Toast Overlay */}
        {toastMsg && (
          <div className="absolute top-md left-1/2 -translate-x-1/2 bg-primary text-on-primary px-lg py-sm rounded-lg shadow-lg text-body-md font-medium z-50 animate-in fade-in slide-in-from-top-4">
            {toastMsg}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
