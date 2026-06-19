import { createContext, useContext, useState, ReactNode } from 'react';

export type TabType = 'ai' | 'pnr' | 'manual';

interface AddEntryContextType {
  isOpen: boolean;
  activeTab: TabType;
  openSheet: (tab?: TabType) => void;
  closeSheet: () => void;
  setActiveTab: (tab: TabType) => void;
  prefillData: any;
  setPrefillData: (data: any) => void;
}

const AddEntryContext = createContext<AddEntryContextType | undefined>(undefined);

export const AddEntryProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('ai');
  const [prefillData, setPrefillData] = useState<any>(null);

  const openSheet = (tab: TabType = 'ai') => {
    setActiveTab(tab);
    setIsOpen(true);
  };

  const closeSheet = () => {
    setIsOpen(false);
    setTimeout(() => {
      setPrefillData(null);
      setActiveTab('ai');
    }, 300); // reset after animation
  };

  return (
    <AddEntryContext.Provider
      value={{
        isOpen,
        activeTab,
        openSheet,
        closeSheet,
        setActiveTab,
        prefillData,
        setPrefillData,
      }}
    >
      {children}
    </AddEntryContext.Provider>
  );
};

export const useAddEntry = () => {
  const context = useContext(AddEntryContext);
  if (context === undefined) {
    throw new Error('useAddEntry must be used within an AddEntryProvider');
  }
  return context;
};
