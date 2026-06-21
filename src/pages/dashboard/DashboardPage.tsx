import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardData, Entry } from '../../types';
import { WeeklyReviewContent } from '../review/ReviewPage';
import { useAddEntry } from '../../context/AddEntryContext';
import { saveAuthToken, getAuthUserId } from '../../lib/auth';

// Extracted Sub-components
import { BudgetRing } from './components/BudgetRing';
import { StatsRow } from './components/StatsRow';
import { RecentEntries } from './components/RecentEntries';
import { CategoryBreakdownChart } from './components/CategoryBreakdownChart';
import { EntryDetailSheet } from './components/EntryDetailSheet';

function getActiveUserId(): string {
  return getAuthUserId();
}

const mockDashboard: DashboardData = {
  weeklyBudgetKg: 18,
  weekCurrentKg: 11.2,
  monthTotalKg: 38.4,
  streakDays: 5,
  friendRank: { position: 2, total: 5 },
  recentEntries: [
    { id: "e1", userId: "user_001", category: "transport", subcategory: "petrol cab", description: "Uber to airport", distanceKm: 20, co2Kg: 4.2, source: "uber", loggedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
    { id: "e2", userId: "user_001", category: "food", subcategory: "non-veg meal", description: "Swiggy — butter chicken", quantity: 1, co2Kg: 3.1, source: "swiggy", loggedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
    { id: "e3", userId: "user_001", category: "transport", subcategory: "metro", description: "Metro to college", distanceKm: 18, co2Kg: 0.4, source: "manual", loggedAt: new Date(Date.now() - 86400000).toISOString(), createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: "e4", userId: "user_001", category: "home", subcategory: "ac", description: "AC — 4 hours", quantity: 4, co2Kg: 1.1, source: "manual", loggedAt: new Date(Date.now() - 86400000).toISOString(), createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: "e5", userId: "user_001", category: "food", subcategory: "veg meal", description: "Dal and roti at home", quantity: 1, co2Kg: 0.7, source: "manual", loggedAt: new Date(Date.now() - 172800000).toISOString(), createdAt: new Date(Date.now() - 172800000).toISOString() }
  ],
  categoryBreakdown: {
    transport: 18.4,
    food: 12.6,
    home: 5.2,
    stuff: 2.2
  }
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { openSheet } = useAddEntry();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [ringPercentage, setRingPercentage] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Capture OAuth token if redirected here from Google callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');
    const name = params.get('name') || 'User';
    if (userId) {
      saveAuthToken(userId, decodeURIComponent(name));
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`/api/users/dashboard`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        // Check if friendRank is just a number, transform it to matching type
        const rank = typeof json.friendRank === 'number' 
          ? { position: json.friendRank, total: 5 } 
          : json.friendRank || { position: 2, total: 5 };
        
        setData({
          weeklyBudgetKg: json.weeklyBudgetKg || 18,
          weekCurrentKg: json.weekCurrentKg || 0,
          monthTotalKg: json.monthTotalKg || 0,
          streakDays: json.streakDays || 0,
          friendRank: rank,
          recentEntries: json.recentEntries || [],
          categoryBreakdown: json.categoryBreakdown || { transport: 0, food: 0, home: 0, stuff: 0 }
        });
      } else {
        setData(mockDashboard);
      }
    } catch (e) {
      console.warn("Using mock data as server is not available:", e);
      setData(mockDashboard);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const handleEntrySaved = (event: Event) => {
      const newEntry = (event as CustomEvent).detail;

      if (newEntry && newEntry.co2Kg != null) {
        // Optimistic update — apply locally immediately, no refetch needed
        const co2 = Number(newEntry.co2Kg) || 0;
        const category = (newEntry.category || 'other').toLowerCase();
        const syntheticEntry = {
          id: `optimistic_${Date.now()}`,
          userId: getActiveUserId(),
          category,
          subcategory: newEntry.subcategory || 'general',
          description: newEntry.description || '',
          distanceKm: newEntry.distanceKm ?? null,
          quantity: newEntry.quantity ?? null,
          unit: newEntry.unit ?? null,
          co2Kg: co2,
          source: newEntry.source || 'manual',
          loggedAt: newEntry.loggedAt || new Date().toISOString(),
          createdAt: newEntry.createdAt || new Date().toISOString(),
        };

        setData(prev => {
          if (!prev) return prev;
          const newBreakdown = { ...prev.categoryBreakdown };
          newBreakdown[category] = (newBreakdown[category] || 0) + co2;
          return {
            ...prev,
            weekCurrentKg: parseFloat((prev.weekCurrentKg + co2).toFixed(2)),
            monthTotalKg: parseFloat((prev.monthTotalKg + co2).toFixed(2)),
            recentEntries: [syntheticEntry, ...prev.recentEntries].slice(0, 5),
            categoryBreakdown: newBreakdown,
          };
        });
      }

      // Background reconciliation after 4s to sync with authoritative server state
      const reconcileTimer = setTimeout(() => fetchDashboardData(), 4000);
      return () => clearTimeout(reconcileTimer);
    };

    window.addEventListener('entry-saved', handleEntrySaved);

    // Monday morning auto-surface check
    const today = new Date();
    const isMonday = today.getDay() === 1;
    if (isMonday) {
      const year = today.getFullYear();
      const tempDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
      const dayNum = tempDate.getUTCDay() || 7;
      tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      const weekId = `${year}-W${weekNo}`;

      const seenWeek = localStorage.getItem('ctrlc_review_seen_week');
      if (seenWeek !== weekId) {
        setShowReviewModal(true);
        localStorage.setItem('ctrlc_review_seen_week', weekId);
      }
    }

    return () => {
      window.removeEventListener('entry-saved', handleEntrySaved);
    };
  }, []);

  // Animate the progress ring when values load
  useEffect(() => {
    if (data) {
      const percentage = (data.weekCurrentKg / data.weeklyBudgetKg) * 100;
      // Animate from 0 to actual value
      const timer = setTimeout(() => {
        setRingPercentage(percentage);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [data]);

  const handleDeleteEntry = async (id: string) => {
    try {
      const res = await fetch(`/api/entries/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok || res.status === 204) {
        // Remove locally from state and refetch or update state
        if (data) {
          const updatedEntries = data.recentEntries.filter(e => e.id !== id);
          const deleted = data.recentEntries.find(e => e.id === id);
          if (deleted) {
            const newWeekCurrent = Math.max(0, data.weekCurrentKg - deleted.co2Kg);
            const newMonthTotal = Math.max(0, data.monthTotalKg - deleted.co2Kg);
            const newBreakdown = { ...data.categoryBreakdown };
            newBreakdown[deleted.category] = Math.max(0, (newBreakdown[deleted.category] || 0) - deleted.co2Kg);
            
            setData({
              ...data,
              weekCurrentKg: newWeekCurrent,
              monthTotalKg: newMonthTotal,
              recentEntries: updatedEntries,
              categoryBreakdown: newBreakdown
            });
          }
        }
      } else {
        // Fallback for mock deletion
        if (data) {
          const updatedEntries = data.recentEntries.filter(e => e.id !== id);
          const deleted = data.recentEntries.find(e => e.id === id);
          if (deleted) {
            setData({
              ...data,
              weekCurrentKg: Math.max(0, data.weekCurrentKg - deleted.co2Kg),
              recentEntries: updatedEntries
            });
          }
        }
      }
    } catch (e) {
      // Mock fallback
      if (data) {
        const updatedEntries = data.recentEntries.filter(e => e.id !== id);
        const deleted = data.recentEntries.find(e => e.id === id);
        if (deleted) {
          setData({
            ...data,
            weekCurrentKg: Math.max(0, data.weekCurrentKg - deleted.co2Kg),
            recentEntries: updatedEntries
          });
        }
      }
    }
    setSelectedEntry(null);
  };

  if (loading || !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-md text-body-md text-on-surface-variant font-medium">Gathering your carbon ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background pb-[80px] md:pb-0 md:pl-64">
      {/* Desktop Header */}
      <header className="hidden md:flex justify-between items-center w-full px-lg py-md border-b bg-surface-container-lowest border-surface-variant max-w-container-max mx-auto">
        <div>
          <h1 className="text-headline-md font-semibold text-primary font-sans">Carbon Dashboard</h1>
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">CtrlC Personal Ledger</p>
        </div>
        <button
          onClick={() => openSheet('ai')}
          className="flex items-center gap-xs px-md py-sm bg-primary-container text-white rounded-full hover:opacity-90 transition-opacity font-medium"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Entry
        </button>
      </header>

      {/* Main Grid */}
      <main className="flex-1 p-md md:p-xl max-w-[800px] w-full mx-auto space-y-lg">
        
        {/* Section 1: Weekly Progress Ring */}
        <BudgetRing
          weeklyBudgetKg={data.weeklyBudgetKg}
          weekCurrentKg={data.weekCurrentKg}
          ringPercentage={ringPercentage}
        />

        {/* Section 2: Stats Row */}
        <StatsRow
          monthTotalKg={data.monthTotalKg}
          streakDays={data.streakDays}
          friendRank={data.friendRank}
        />

        {/* Section 3: Recent Entries */}
        <RecentEntries
          entries={data.recentEntries}
          onSelectEntry={setSelectedEntry}
        />

        {/* Section 4: Category Breakdown */}
        <CategoryBreakdownChart
          breakdown={data.categoryBreakdown}
        />

      </main>

      {/* Floating Action Button (Mobile only) */}
      <button
        onClick={() => openSheet('ai')}
        className="md:hidden fixed bottom-[90px] right-md w-14 h-14 bg-primary-container text-white rounded-full flex items-center justify-center hover:scale-105 transition-transform z-20 shadow-[0_4px_25px_rgba(0,0,0,0.15)]"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </button>

      {/* Entry Detail Bottom Sheet */}
      {selectedEntry && (
        <EntryDetailSheet
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onDelete={handleDeleteEntry}
        />
      )}

      {showReviewModal && (
        <div className="fixed inset-0 bg-primary/20 backdrop-blur-[2px] z-50 flex items-center justify-center p-md">
          <div className="bg-surface w-full max-w-[500px] rounded-lg shadow-[0_5px_30px_rgba(0,0,0,0.15)] overflow-y-auto max-h-[90vh]">
            <WeeklyReviewContent isModal={true} onClose={() => setShowReviewModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
