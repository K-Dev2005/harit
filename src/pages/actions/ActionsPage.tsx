import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Utensils, Zap, ShoppingBag, Check } from 'lucide-react';

const DEFAULT_USER_ID = 'user_001';

interface ActionCard {
  id: string;
  category: string;
  headline: string;
  savingKg: number;
  metaphor: string;
  committed: boolean;
}

const mockActions: ActionCard[] = [
  {
    id: "a1",
    category: "transport",
    headline: "Take metro twice this week",
    savingKg: 0.6,
    metaphor: "= skipping 3 km by cab",
    committed: false
  },
  {
    id: "a2",
    category: "food",
    headline: "Try one plant-based meal today",
    savingKg: 1.8,
    metaphor: "= not driving 8.5 km",
    committed: false
  },
  {
    id: "a3",
    category: "home",
    headline: "Set AC to 24°C instead of 22°C",
    savingKg: 0.4,
    metaphor: "= one metro trip's worth",
    committed: true
  }
];

export const ActionsPage: React.FC = () => {
  const [actions, setActions] = useState<ActionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [committingId, setCommittingId] = useState<string | null>(null);

  // Helper to format the current week's date range (e.g., "Jun 16–22")
  const getWeeklyDateRangeString = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const startMonth = months[monday.getMonth()];
    const endMonth = months[sunday.getMonth()];
    
    if (startMonth === endMonth) {
      return `${startMonth} ${monday.getDate()}–${sunday.getDate()}`;
    } else {
      return `${startMonth} ${monday.getDate()} – ${endMonth} ${sunday.getDate()}`;
    }
  };

  const fetchActions = async () => {
    try {
      const res = await fetch(`/api/actions/weekly?userId=${DEFAULT_USER_ID}`);
      if (res.ok) {
        const json = await res.json();
        const cards = json.cards || [];
        
        // Map the backend card keys to match local structure if needed
        const mappedCards: ActionCard[] = cards.map((card: any, idx: number) => {
          const cardId = card.id || `a_${idx}_${card.category}`;
          return {
            id: cardId,
            category: card.category || 'transport',
            headline: card.headline || 'Take action this week',
            savingKg: card.savingKg || card.estimatedWeeklySavingKg || 0.5,
            metaphor: card.metaphor || '= saving carbon',
            committed: card.committed || false
          };
        });

        // Merge with localStorage committed statuses
        const localCommitted = JSON.parse(localStorage.getItem('harit_committed_actions') || '[]');
        const finalCards = (mappedCards.length > 0 ? mappedCards : mockActions).map(c => ({
          ...c,
          committed: c.committed || localCommitted.includes(c.id)
        }));

        setActions(finalCards);
      } else {
        fallbackToMock();
      }
    } catch (e) {
      console.warn("Failed fetching backend actions, falling back to mock:", e);
      fallbackToMock();
    } finally {
      setLoading(false);
    }
  };

  const fallbackToMock = () => {
    const localCommitted = JSON.parse(localStorage.getItem('harit_committed_actions') || '[]');
    const finalCards = mockActions.map(c => ({
      ...c,
      committed: c.committed || localCommitted.includes(c.id)
    }));
    setActions(finalCards);
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const handleCommit = async (cardId: string) => {
    setCommittingId(cardId);
    
    try {
      // POST to /api/pledges { actionCardId, userId }
      await fetch('/api/pledges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionCardId: cardId,
          userId: DEFAULT_USER_ID
        })
      });

      // Update state and localStorage regardless of API success (graceful offline behavior)
      const localCommitted = JSON.parse(localStorage.getItem('harit_committed_actions') || '[]');
      if (!localCommitted.includes(cardId)) {
        localCommitted.push(cardId);
        localStorage.setItem('harit_committed_actions', JSON.stringify(localCommitted));
      }

      setActions(prev => prev.map(c => c.id === cardId ? { ...c, committed: true } : c));

      // Trigger Confetti Burst
      if ((window as any).confetti) {
        (window as any).confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 }
        });
      }
    } catch (e) {
      console.error("Failed to post pledge, but committing locally:", e);
      
      const localCommitted = JSON.parse(localStorage.getItem('harit_committed_actions') || '[]');
      if (!localCommitted.includes(cardId)) {
        localCommitted.push(cardId);
        localStorage.setItem('harit_committed_actions', JSON.stringify(localCommitted));
      }
      setActions(prev => prev.map(c => c.id === cardId ? { ...c, committed: true } : c));

      if ((window as any).confetti) {
        (window as any).confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 }
        });
      }
    } finally {
      setCommittingId(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'transport':
        return <Car className="w-5 h-5" />;
      case 'food':
        return <Utensils className="w-5 h-5" />;
      case 'home':
        return <Zap className="w-5 h-5" />;
      default:
        return <ShoppingBag className="w-5 h-5" />;
    }
  };

  const getCategoryColors = (category: string) => {
    switch (category.toLowerCase()) {
      case 'transport':
        return 'bg-secondary-container text-primary-container';
      case 'food':
        return 'bg-secondary/20 text-secondary';
      case 'home':
        return 'bg-[#ffdad6] text-[#ba1a1a]';
      default:
        return 'bg-surface-container-high text-primary';
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-md text-xs font-semibold text-on-surface-variant">Curating your actions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background pb-[100px] md:pb-lg md:pl-64">
      {/* Header */}
      <header className="flex justify-between items-center w-full px-lg py-md border-b bg-surface-container-lowest border-surface-variant max-w-container-max mx-auto">
        <div>
          <h1 className="text-headline-md font-semibold text-primary font-sans">This week's actions</h1>
          <p className="text-label-sm text-on-surface-variant font-medium uppercase tracking-wider">{getWeeklyDateRangeString()}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-md md:p-xl max-w-[600px] w-full mx-auto space-y-md">
        <div className="space-y-md">
          {actions.map((card) => (
            <div 
              key={card.id} 
              className="bg-surface border border-surface-variant/80 rounded-lg p-md flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.01)] transition-all hover:border-outline-variant"
            >
              <div className="flex gap-md mb-md">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getCategoryColors(card.category)}`}>
                  {getCategoryIcon(card.category)}
                </div>
                <div className="space-y-xs">
                  <h3 className="font-semibold text-[15px] text-primary leading-tight font-sans">
                    {card.headline}
                  </h3>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[12px] font-bold text-secondary">
                      Saves ~{card.savingKg.toFixed(1)} kg CO₂ this week
                    </span>
                    <span className="text-[10px] text-on-surface-variant italic">
                      {card.metaphor}
                    </span>
                  </div>
                </div>
              </div>

              {card.committed ? (
                <div className="w-full bg-[#aeeecb]/40 border border-[#2c694e]/20 text-secondary rounded-full py-sm flex items-center justify-center gap-xs text-xs font-bold font-sans">
                  <Check className="w-4 h-4" />
                  Committed ✓
                </div>
              ) : (
                <button
                  onClick={() => handleCommit(card.id)}
                  disabled={committingId === card.id}
                  className="w-full bg-primary-container hover:bg-primary text-white rounded-full py-sm font-semibold text-xs transition-all flex items-center justify-center gap-xs shadow-[0_2px_8px_rgba(27,67,50,0.15)] active:scale-[0.98]"
                >
                  {committingId === card.id ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    "Commit to this"
                  )}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="text-center pt-md">
          <p className="text-[11px] text-on-surface-variant font-medium">
            Cards refresh every Monday based on your habits.
          </p>
        </div>
      </main>
    </div>
  );
};

export default ActionsPage;
