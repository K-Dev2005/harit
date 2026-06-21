import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Share2, Sparkles, CheckCircle, AlertTriangle, ArrowLeft, X } from 'lucide-react';

const DEFAULT_USER_ID = 'user_001';

interface WeeklyReviewData {
  totalEmissionsKg: number;
  budgetKg: number;
  bestCategory: string;
  bestCategoryImprovement: number; // e.g. 18 for 18%
  pledgesKept: number;
  pledgesTotal: number;
  pointsEarned: number;
  streakDays: number;
}

const mockReviewData: WeeklyReviewData = {
  totalEmissionsKg: 14.2,
  budgetKg: 18.0,
  bestCategory: "Food",
  bestCategoryImprovement: 18,
  pledgesKept: 2,
  pledgesTotal: 3,
  pointsEarned: 145,
  streakDays: 5
};

interface WeeklyReviewContentProps {
  isModal?: boolean;
  onClose?: () => void;
}

export const WeeklyReviewContent: React.FC<WeeklyReviewContentProps> = ({ isModal = false, onClose }) => {
  const [data, setData] = useState<WeeklyReviewData | null>(null);
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const cardRef = useRef<HTMLDivElement>(null);

  // Helper to format last week's date range (e.g. "Jun 9–15")
  const getLastWeekDateRangeString = () => {
    const today = new Date();
    const day = today.getDay();
    // Shift to Monday of current week, then subtract 7 days to get last week's Monday
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) - 7;
    const lastMonday = new Date(today.setDate(diff));
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const startMonth = months[lastMonday.getMonth()];
    const endMonth = months[lastSunday.getMonth()];
    
    if (startMonth === endMonth) {
      return `${startMonth} ${lastMonday.getDate()}–${lastSunday.getDate()}`;
    } else {
      return `${startMonth} ${lastMonday.getDate()} – ${endMonth} ${lastSunday.getDate()}`;
    }
  };

  const fetchReviewAndInsight = async () => {
    try {
      // 1. Fetch AI Insight
      const insightRes = await fetch(`/api/insights/weekly`, { credentials: 'include' });
      if (insightRes.ok) {
        const insightJson = await insightRes.ok ? await insightRes.json() : { insight: '' };
        setInsight(insightJson.insight || "Your transport emissions dropped every day this week — switching to metro on Wednesday made the biggest difference.");
      } else {
        setInsight("Your transport emissions dropped every day this week — switching to metro on Wednesday made the biggest difference.");
      }

      // 2. Fetch Dashboard/User stats to compile review details
      const userRes = await fetch(`/api/users/dashboard`, { credentials: 'include' });
      if (userRes.ok) {
        const userJson = await userRes.json();
        // Assemble review data from API response
        setData({
          totalEmissionsKg: userJson.weekCurrentKg || 14.2,
          budgetKg: userJson.weeklyBudgetKg || 18.0,
          bestCategory: "Food", // Hardcoded or inferred
          bestCategoryImprovement: 18,
          pledgesKept: 2, // Hardcoded/mocked for review
          pledgesTotal: 3,
          pointsEarned: 145,
          streakDays: userJson.streakDays || 5
        });
      } else {
        setData(mockReviewData);
      }
    } catch (e) {
      console.warn("Error loading weekly review data, using mock:", e);
      setData(mockReviewData);
      setInsight("Your transport emissions dropped every day this week — switching to metro on Wednesday made the biggest difference.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewAndInsight();
  }, []);

  const handleShare = async () => {
    if (!cardRef.current || !data) return;
    setSharing(true);
    setShareStatus('idle');

    try {
      const html2canvas = (window as any).html2canvas;
      if (!html2canvas) {
        throw new Error("html2canvas not loaded");
      }

      // Hide the share button before capturing
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#f8f9fa',
        logging: false
      });

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error("Canvas blob creation failed");

      const file = new File([blob], `ctrlc_week_${Date.now()}.png`, { type: 'image/png' });
      const shareData = {
        title: 'My CtrlC Carbon Week',
        text: `I saved carbon with CtrlC! Emissions: ${data.totalEmissionsKg.toFixed(1)} kg vs my ${data.budgetKg.toFixed(1)} kg budget. #CtrlC`,
        files: [file]
      };

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share(shareData);
        setShareStatus('success');
      } else {
        // Fallback: Copy Link / Text to Clipboard
        const textToCopy = `🌱 My Carbon Footprint Review (Week of ${getLastWeekDateRangeString()}):
- Total Emissions: ${data.totalEmissionsKg.toFixed(1)} kg CO₂e
- Weekly Budget: ${data.budgetKg.toFixed(1)} kg CO₂e (${data.totalEmissionsKg <= data.budgetKg ? 'Under budget!' : 'Over budget'})
- Streak: ${data.streakDays} days
Logged via CtrlC Carbon Ledger.`;
        
        await navigator.clipboard.writeText(textToCopy);
        setShareStatus('success');
      }
    } catch (err) {
      console.error("Sharing failed:", err);
      setShareStatus('error');
    } finally {
      setSharing(false);
      setTimeout(() => setShareStatus('idle'), 3000);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center p-xl min-h-[300px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-md text-xs font-semibold text-on-surface-variant">Reviewing your carbon budget...</p>
        </div>
      </div>
    );
  }

  const isUnderBudget = data.totalEmissionsKg <= data.budgetKg;
  const budgetDifference = Math.abs(data.totalEmissionsKg - data.budgetKg);

  return (
    <div 
      ref={cardRef} 
      className={`bg-background w-full rounded-lg ${isModal ? 'p-0' : 'p-md md:p-lg max-w-[600px] mx-auto'}`}
    >
      {/* Modal Close / Header */}
      {isModal && (
        <div className="flex justify-between items-center border-b border-surface-variant pb-sm mb-md px-lg pt-lg">
          <div>
            <h2 className="font-semibold text-body-lg text-primary font-sans">Weekly Review</h2>
            <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">Week of {getLastWeekDateRangeString()}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-xs text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Review Sheet Card */}
      <div className={`space-y-md ${isModal ? 'px-lg pb-lg' : ''}`}>
        
        {/* Date Range Subheader (if not modal) */}
        {!isModal && (
          <div className="mb-md">
            <p className="text-label-sm text-on-surface-variant font-bold uppercase tracking-widest">
              Review · Week of {getLastWeekDateRangeString()}
            </p>
          </div>
        )}

        {/* Hero Card */}
        <div className="bg-surface border border-surface-variant/80 rounded-lg p-lg text-center shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
          <span className="text-label-sm font-semibold text-on-surface-variant uppercase tracking-widest block mb-xs">
            Emissions Total
          </span>
          <span className="text-[48px] font-extrabold text-primary leading-none tracking-tighter block mb-xs">
            {data.totalEmissionsKg.toFixed(1)} kg
          </span>
          <span className="text-xs text-on-surface-variant block mb-sm">
            vs your {data.budgetKg.toFixed(1)} kg budget
          </span>

          <div className="flex items-center justify-center gap-xs mt-sm py-xs px-md rounded-full max-w-fit mx-auto bg-background">
            {isUnderBudget ? (
              <>
                <CheckCircle className="w-4 h-4 text-secondary fill-secondary/20" />
                <span className="text-xs font-bold text-secondary">Under budget — great week</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-error" />
                <span className="text-xs font-bold text-error">Over by {budgetDifference.toFixed(1)} kg</span>
              </>
            )}
          </div>
        </div>

        {/* 3 Smaller Stats Row */}
        <div className="grid grid-cols-3 gap-sm">
          <div className="bg-surface border border-surface-variant/80 rounded-lg p-md text-center flex flex-col justify-between">
            <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider leading-none">Best Cat</span>
            <span className="text-xs font-extrabold text-primary my-sm block truncate">
              {data.bestCategory}
            </span>
            <span className="text-[10px] text-secondary font-bold">
              down {data.bestCategoryImprovement}%
            </span>
          </div>

          <div className="bg-surface border border-surface-variant/80 rounded-lg p-md text-center flex flex-col justify-between">
            <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider leading-none">Pledges</span>
            <span className="text-md font-extrabold text-primary my-sm block">
              {data.pledgesKept} of {data.pledgesTotal}
            </span>
            <span className="text-[10px] text-on-surface-variant font-semibold">
              kept
            </span>
          </div>

          <div className="bg-surface border border-surface-variant/80 rounded-lg p-md text-center flex flex-col justify-between">
            <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider leading-none">Points</span>
            <span className="text-md font-extrabold text-[#2c694e] my-sm block">
              +{data.pointsEarned}
            </span>
            <span className="text-[10px] text-[#2c694e] font-semibold">
              earned
            </span>
          </div>
        </div>

        {/* AI Insight Line */}
        {insight && (
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-md flex gap-sm items-start">
            <Sparkles className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
            <p className="text-xs text-primary leading-relaxed italic font-medium font-sans">
              "{insight}"
            </p>
          </div>
        )}

        {/* Streak Card */}
        <div className="bg-surface border border-surface-variant/80 rounded-lg p-md flex items-center gap-md">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-primary font-sans">
              {data.streakDays} day streak
            </h4>
            <p className="text-[10px] text-on-surface-variant leading-normal">
              Keep logging daily to protect your streak.
            </p>
          </div>
        </div>

        {/* Share Button */}
        <div className="pt-sm">
          <button
            onClick={handleShare}
            disabled={sharing}
            className="w-full bg-primary-container hover:bg-primary text-white rounded-full py-sm font-semibold text-xs transition-all flex items-center justify-center gap-xs shadow-[0_2px_8px_rgba(27,67,50,0.15)] active:scale-[0.98]"
          >
            {sharing ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Share my week
              </>
            )}
          </button>
          {shareStatus === 'success' && (
            <p className="text-center text-[10px] text-secondary font-bold mt-xs animate-pulse">
              Shared successfully / summary copied to clipboard!
            </p>
          )}
          {shareStatus === 'error' && (
            <p className="text-center text-[10px] text-error font-bold mt-xs">
              Unable to share. Try copying manually.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export const ReviewPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background pb-[100px] md:pb-lg md:pl-64">
      {/* Header with back button */}
      <header className="flex items-center gap-md w-full px-lg py-md border-b bg-surface-container-lowest border-surface-variant max-w-container-max mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-xs text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-headline-md font-semibold text-primary font-sans">Weekly Review</h1>
          <p className="text-label-sm text-on-surface-variant font-medium uppercase tracking-wider">Carbon Budget Analysis</p>
        </div>
      </header>

      {/* Main Review Content */}
      <main className="flex-grow p-md md:p-xl">
        <WeeklyReviewContent />
      </main>
    </div>
  );
};

export default ReviewPage;
