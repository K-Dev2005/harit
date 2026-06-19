import React, { useState, useEffect } from 'react';
import { Users, Plus, ArrowUp, ArrowDown } from 'lucide-react';

const DEFAULT_USER_ID = 'user_001';

interface LeaderboardUser {
  name: string;
  weekKg: number;
  deltaKg: number;
  isMe: boolean;
}

interface Challenge {
  name: string;
  targetKg: number;
  savedKg: number;
  daysRemaining: number;
  participants: string[];
}

const mockLeaderboard: LeaderboardUser[] = [
  { name: "Vardaan", weekKg: 9.2, deltaKg: -1.4, isMe: false },
  { name: "Kishlay", weekKg: 11.2, deltaKg: -2.1, isMe: true },
  { name: "Arsh", weekKg: 14.7, deltaKg: 0.8, isMe: false },
  { name: "Priya", weekKg: 16.1, deltaKg: -0.3, isMe: false },
  { name: "Rohan", weekKg: 19.4, deltaKg: 1.2, isMe: false }
];

const mockChallenge: Challenge = {
  name: "Namma Metro Rideout",
  targetKg: 50,
  savedKg: 28.6,
  daysRemaining: 4,
  participants: ["K", "V", "A", "P"]
};

export const LeaderboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'friends' | 'challenge'>('friends');
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [challenge, setChallenge] = useState<Challenge | null>(null); // Start with null for empty state
  const [loading, setLoading] = useState(true);

  // Helper to format current week range (e.g. "Jun 16–22")
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

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`/api/users/leaderboard?userId=${DEFAULT_USER_ID}`);
      if (res.ok) {
        const json = await res.json();
        const list = json.leaderboard || [];
        
        // If user is not present in fetched leaderboard, merge/append
        const hasMe = list.some((u: any) => u.isMe || u.name === 'Kishlay');
        if (!hasMe && list.length > 0) {
          list.push({ name: 'Kishlay', weekKg: 11.2, deltaKg: -2.1, isMe: true });
        }
        
        // Sort by lowest emissions
        const sortedList = (list.length > 0 ? list : mockLeaderboard).sort((a: any, b: any) => a.weekKg - b.weekKg);
        setLeaderboard(sortedList);
      } else {
        fallbackToMock();
      }
    } catch (e) {
      console.warn("Failed to fetch leaderboard from server, falling back to mock:", e);
      fallbackToMock();
    } finally {
      setLoading(false);
    }
  };

  const fallbackToMock = () => {
    const sorted = [...mockLeaderboard].sort((a, b) => a.weekKg - b.weekKg);
    setLeaderboard(sorted);
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const handleStartChallenge = () => {
    setChallenge(mockChallenge);
  };

  const handleInviteFriend = () => {
    const text = "Hey! Join my carbon-saving challenge on Harit. Let's cut our cab commutes together!";
    if (navigator.share) {
      navigator.share({
        title: 'Harit Challenge Invite',
        text: text,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      alert("Invite link copied to clipboard!");
    }
  };

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0:
        return {
          bg: 'bg-[#f59e0b] text-white font-extrabold', // Gold
          label: '👑',
          border: 'border-[#f59e0b]/50'
        };
      case 1:
        return {
          bg: 'bg-[#9ca3af] text-white font-extrabold', // Silver
          label: '2',
          border: 'border-[#9ca3af]/50'
        };
      case 2:
        return {
          bg: 'bg-[#b45309] text-white font-extrabold', // Bronze
          label: '3',
          border: 'border-[#b45309]/50'
        };
      default:
        return {
          bg: 'bg-surface-container-high text-on-surface-variant font-medium',
          label: `${index + 1}`,
          border: 'border-surface-variant'
        };
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background pb-[100px] md:pb-lg md:pl-64">
      {/* Header */}
      <header className="flex flex-col w-full border-b bg-surface-container-lowest border-surface-variant max-w-container-max mx-auto px-lg py-sm">
        <h1 className="text-headline-md font-semibold text-primary font-sans pt-xs">Leaderboard</h1>
        
        {/* Tabs */}
        <div className="flex gap-lg mt-md">
          <button
            onClick={() => setActiveTab('friends')}
            className={`pb-sm text-xs font-bold transition-all border-b-2 ${
              activeTab === 'friends'
                ? 'border-primary text-primary font-extrabold'
                : 'border-transparent text-on-surface-variant hover:text-primary'
            }`}
          >
            Friends
          </button>
          <button
            onClick={() => setActiveTab('challenge')}
            className={`pb-sm text-xs font-bold transition-all border-b-2 ${
              activeTab === 'challenge'
                ? 'border-primary text-primary font-extrabold'
                : 'border-transparent text-on-surface-variant hover:text-primary'
            }`}
          >
            Weekly challenge
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-md md:p-xl max-w-[600px] w-full mx-auto">
        {activeTab === 'friends' ? (
          <div className="space-y-md">
            <div>
              <h2 className="text-[15px] font-bold text-primary leading-tight font-sans">
                This week — lowest emissions wins
              </h2>
              <p className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-wider mt-1">
                Week of {getWeeklyDateRangeString()}
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-xl">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : (
              <div className="bg-surface border border-surface-variant/80 rounded-lg overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
                {leaderboard.map((user, index) => {
                  const rank = getRankStyle(index);
                  return (
                    <div
                      key={user.name}
                      className={`flex items-center justify-between px-md py-sm border-b border-surface-variant/40 last:border-b-0 transition-colors ${
                        user.isMe ? 'bg-secondary/10 font-semibold border-l-4 border-secondary' : 'hover:bg-surface-container-lowest'
                      }`}
                    >
                      <div className="flex items-center gap-md">
                        {/* Rank Badge */}
                        <span className="w-5 text-center text-xs font-extrabold text-on-surface-variant">
                          {index + 1}
                        </span>

                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold border ${rank.bg} ${rank.border}`}>
                          {user.name.substring(0, 1)}
                        </div>

                        {/* Name */}
                        <span className="text-xs text-primary font-bold">
                          {user.name} {user.isMe && <span className="text-[10px] text-secondary font-medium ml-1">(you)</span>}
                        </span>
                      </div>

                      <div className="flex items-center gap-md">
                        <span className="text-xs font-bold text-primary">
                          {user.weekKg.toFixed(1)} kg
                        </span>

                        {/* Delta Badge */}
                        <div className={`flex items-center gap-0.5 px-sm py-[2px] rounded-full text-[10px] font-extrabold ${
                          user.deltaKg < 0 
                            ? 'bg-[#aeeecb]/40 text-secondary' 
                            : 'bg-error-container/30 text-error'
                        }`}>
                          {user.deltaKg < 0 ? (
                            <>
                              <ArrowDown className="w-3 h-3" />
                              {Math.abs(user.deltaKg).toFixed(1)} kg
                            </>
                          ) : (
                            <>
                              <ArrowUp className="w-3 h-3" />
                              {user.deltaKg.toFixed(1)} kg
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-md">
            {challenge ? (
              <div className="bg-surface border border-surface-variant/80 rounded-lg p-lg space-y-md shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-[16px] text-primary leading-snug font-sans">
                      {challenge.name}
                    </h3>
                    <p className="text-[11px] text-on-surface-variant font-medium mt-1">
                      Group carbon-saving goal
                    </p>
                  </div>
                  <span className="bg-primary-container/10 text-primary-container px-sm py-[3px] rounded-full text-[10px] font-bold">
                    {challenge.daysRemaining} days left
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-xs pt-xs">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-secondary">{challenge.savedKg.toFixed(1)} kg saved</span>
                    <span className="text-on-surface-variant">Goal: {challenge.targetKg} kg</span>
                  </div>
                  <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                    <div 
                      className="bg-secondary h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (challenge.savedKg / challenge.targetKg) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Participant Avatars */}
                <div className="flex justify-between items-center pt-md border-t border-surface-variant/40">
                  <div className="flex -space-x-2 overflow-hidden">
                    {challenge.participants.map((avatar, idx) => (
                      <div 
                        key={idx}
                        className="inline-block h-8 w-8 rounded-full ring-2 ring-surface bg-secondary-container text-primary-container font-extrabold flex items-center justify-center text-xs border border-primary/10"
                      >
                        {avatar}
                      </div>
                    ))}
                    <div className="inline-block h-8 w-8 rounded-full ring-2 ring-surface bg-surface-container text-on-surface-variant font-bold flex items-center justify-center text-xs border border-outline-variant/30">
                      +
                    </div>
                  </div>

                  <button
                    onClick={handleInviteFriend}
                    className="flex items-center gap-xs text-xs font-bold text-secondary hover:text-primary transition-colors bg-secondary-container/20 hover:bg-secondary-container/40 px-md py-sm rounded-full"
                  >
                    <Plus className="w-4 h-4" />
                    Invite a friend
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-surface border border-surface-variant/80 rounded-lg p-lg text-center space-y-md shadow-[0_2px_10px_rgba(0,0,0,0.01)] py-[48px]">
                <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center mx-auto text-on-surface-variant">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-xs">
                  <h3 className="font-semibold text-[15px] text-primary font-sans">
                    No challenge active
                  </h3>
                  <p className="text-[11px] text-on-surface-variant max-w-[280px] mx-auto leading-relaxed">
                    Collaborate with your friends to unlock massive carbon budget savings.
                  </p>
                </div>
                <button
                  onClick={handleStartChallenge}
                  className="bg-primary-container hover:bg-primary text-white rounded-full py-sm px-xl font-semibold text-xs transition-all inline-flex items-center gap-xs shadow-[0_2px_8px_rgba(27,67,50,0.15)] active:scale-[0.98] mt-sm"
                >
                  Start a challenge
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default LeaderboardPage;
