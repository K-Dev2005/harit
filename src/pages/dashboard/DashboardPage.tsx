import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EMISSION_FACTORS } from '../../lib/emissionFactors';
import { DashboardData, Entry } from '../../types';
import { WeeklyReviewContent } from '../review/ReviewPage';
import { useAddEntry } from '../../context/AddEntryContext';
import { saveAuthToken, getAuthUserId } from '../../lib/auth';

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

  // Calculate Ring values
  const budget = data.weeklyBudgetKg;
  const current = data.weekCurrentKg;
  const remaining = budget - current;
  const isOver = remaining < 0;

  // SVG calculations
  const r = 80;
  const circumference = 2 * Math.PI * r; // ~502.6
  // Fills clockwise from top. Dashoffset represents the EMPTY part.
  const percentageClamped = Math.min(100, Math.max(0, ringPercentage));
  const strokeDashoffset = circumference - (percentageClamped / 100) * circumference;

  // Determine Ring Color
  let ringColor = 'stroke-primary'; // Under 80% (green)
  if (current >= budget * 0.8 && current <= budget) {
    ringColor = 'stroke-[#d97706]'; // 80-100% (amber)
  } else if (current > budget) {
    ringColor = 'stroke-[#dc2626]'; // Over budget (red)
  }

  // Category Breakdown values
  const breakdown = data.categoryBreakdown;
  const totalBreakdown = Object.values(breakdown).reduce((sum, v) => sum + v, 0) || 1;

  const categories = [
    { key: 'transport', label: 'Transport', color: 'bg-secondary', text: 'text-on-secondary' },
    { key: 'food', label: 'Food', color: 'bg-secondary-container', text: 'text-on-secondary-container' },
    { key: 'home', label: 'Home', color: 'bg-primary-container', text: 'text-on-primary-container' },
    { key: 'stuff', label: 'Stuff', color: 'bg-tertiary', text: 'text-on-tertiary' }
  ];

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
                Limit: {budget.toFixed(1)} kg
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
                {current.toFixed(1)}
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

        {/* Section 2: Stats Row */}
        <section className="grid grid-cols-3 gap-sm">
          <div className="bg-surface-container-low hover:bg-surface-container rounded-md p-md flex flex-col justify-between transition-colors">
            <span className="text-[12px] text-on-surface-variant font-medium tracking-tight">This month</span>
            <span className="text-[20px] md:text-[22px] font-semibold text-primary mt-xs">{data.monthTotalKg.toFixed(1)} kg</span>
          </div>
          <div className="bg-surface-container-low hover:bg-surface-container rounded-md p-md flex flex-col justify-between transition-colors">
            <span className="text-[12px] text-on-surface-variant font-medium tracking-tight">Streak</span>
            <span className="text-[20px] md:text-[22px] font-semibold text-primary mt-xs">{data.streakDays} days</span>
          </div>
          <div className="bg-surface-container-low hover:bg-surface-container rounded-md p-md flex flex-col justify-between transition-colors">
            <span className="text-[12px] text-on-surface-variant font-medium tracking-tight">Friend rank</span>
            <span className="text-[20px] md:text-[22px] font-semibold text-primary mt-xs">
              #{typeof data.friendRank === 'object' ? data.friendRank.position : data.friendRank} of {typeof data.friendRank === 'object' ? data.friendRank.total : 5}
            </span>
          </div>
        </section>

        {/* Section 3: Recent Entries */}
        <section className="bg-surface-container-lowest border border-surface-variant rounded-lg p-lg shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
          <div className="flex justify-between items-center mb-md border-b border-surface-variant/40 pb-xs">
            <h2 className="font-semibold text-body-lg text-primary">Recent entries</h2>
            <button className="text-secondary font-semibold text-xs hover:underline">See all</button>
          </div>

          <div className="divide-y divide-surface-container-low">
            {data.recentEntries.length === 0 ? (
              <p className="text-center py-md text-xs text-on-surface-variant">No entries recorded yet.</p>
            ) : (
              data.recentEntries.slice(0, 5).map((entry) => {
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
                    onClick={() => setSelectedEntry(entry)}
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

        {/* Section 4: Category Breakdown */}
        <section className="bg-surface-container-lowest border border-surface-variant rounded-lg p-lg shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
          <h2 className="font-semibold text-body-lg text-primary mb-md">This month by category</h2>
          
          {/* Stacked Bar Chart */}
          <div className="w-full h-[12px] bg-surface-container rounded-full overflow-hidden flex mb-md">
            {categories.map((cat) => {
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
            {categories.map((cat) => {
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
        <div className="fixed inset-0 bg-primary/20 backdrop-blur-[2px] z-50 flex items-end justify-center">
          <div className="bg-surface-container-lowest w-full max-w-[500px] rounded-t-lg p-lg space-y-md shadow-[0_-5px_30px_rgba(0,0,0,0.15)] animate-slide-up">
            <div className="flex justify-between items-start border-b border-surface-variant pb-sm">
              <div>
                <h3 className="font-semibold text-body-lg text-primary">{selectedEntry.description}</h3>
                <p className="text-[12px] text-on-surface-variant capitalize">{selectedEntry.category} • {selectedEntry.subcategory || 'General'}</p>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="p-xs text-on-surface-variant hover:bg-surface-container rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-sm py-xs">
              <div className="flex justify-between">
                <span className="text-xs text-on-surface-variant">Carbon Footprint</span>
                <span className="text-xs font-semibold text-primary">{selectedEntry.co2Kg.toFixed(1)} kg CO2e</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-on-surface-variant">Logged Source</span>
                <span className="text-xs font-medium text-primary capitalize">{selectedEntry.source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-on-surface-variant">Date logged</span>
                <span className="text-xs font-medium text-primary">
                  {new Date(selectedEntry.loggedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </span>
              </div>
            </div>

            <div className="flex gap-sm border-t border-surface-variant pt-md">
              <button
                onClick={() => handleDeleteEntry(selectedEntry.id)}
                className="flex-1 py-sm bg-[#dc2626] text-white rounded-full font-semibold text-xs hover:bg-[#b91c1c] transition-colors"
              >
                Delete Entry
              </button>
              <button
                onClick={() => setSelectedEntry(null)}
                className="flex-1 py-sm border border-outline-variant text-primary rounded-full font-semibold text-xs hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
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
