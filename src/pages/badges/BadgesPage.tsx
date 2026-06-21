import React, { useState, useEffect } from 'react';

import { 
  Footprints, Train, Leaf, Flame, Plane, Users, 
  Target, Salad, Car, Bus, Award, Trophy, Lock 
} from 'lucide-react';

const DEFAULT_USER_ID = 'user_001';

interface BadgeDefinition {
  slug: string;
  name: string;
  description: string;
  unlockCondition: string;
  iconName: string;
  category: 'transport' | 'food' | 'home' | 'stuff' | 'social' | 'system';
  colorClass: string;
  earnedDefault: boolean;
}

const BADGES_LIST: BadgeDefinition[] = [
  {
    slug: "first_step",
    name: "First step",
    description: "Logged your first entry",
    unlockCondition: "Log your first carbon ledger entry",
    iconName: "footprints",
    category: "system",
    colorClass: "bg-primary-container text-white",
    earnedDefault: true
  },
  {
    slug: "metro_hero",
    name: "Metro hero",
    description: "10 metro trips logged",
    unlockCondition: "Log 10 rides taken via the metro",
    iconName: "train",
    category: "transport",
    colorClass: "bg-secondary-container text-primary-container",
    earnedDefault: true
  },
  {
    slug: "plant_week",
    name: "Plant week",
    description: "7 days under 1.5 kg food emissions",
    unlockCondition: "Keep food emissions under 1.5 kg for 7 days",
    iconName: "leaf",
    category: "food",
    colorClass: "bg-secondary text-white",
    earnedDefault: true
  },
  {
    slug: "week_warrior",
    name: "Week warrior",
    description: "7-day logging streak",
    unlockCondition: "7-day logging streak",
    iconName: "flame",
    category: "system",
    colorClass: "bg-[#ffdad6] text-[#ba1a1a]",
    earnedDefault: false
  },
  {
    slug: "flight_offset",
    name: "Flight offset",
    description: "Offset your first flight",
    unlockCondition: "Offset your first flight",
    iconName: "plane",
    category: "transport",
    colorClass: "bg-sky-100 text-sky-800",
    earnedDefault: false
  },
  {
    slug: "social_spark",
    name: "Social spark",
    description: "Invite your first friend",
    unlockCondition: "Invite your first friend",
    iconName: "users",
    category: "social",
    colorClass: "bg-purple-100 text-purple-800",
    earnedDefault: false
  },
  {
    slug: "budget_master",
    name: "Budget master",
    description: "Under budget 4 weeks in a row",
    unlockCondition: "Under budget 4 weeks in a row",
    iconName: "target",
    category: "system",
    colorClass: "bg-emerald-100 text-emerald-800",
    earnedDefault: false
  },
  {
    slug: "food_swap",
    name: "Food swap",
    description: "Log 10 veg/vegan meals",
    unlockCondition: "Log 10 veg/vegan meals",
    iconName: "salad",
    category: "food",
    colorClass: "bg-green-100 text-green-800",
    earnedDefault: false
  },
  {
    slug: "zero_cab_week",
    name: "Zero cab week",
    description: "No cab rides for a full week",
    unlockCondition: "No cab rides for a full week",
    iconName: "car_crossed",
    category: "transport",
    colorClass: "bg-teal-100 text-teal-800",
    earnedDefault: false
  },
  {
    slug: "green_commuter",
    name: "Green commuter",
    description: "20 metro or bus trips",
    unlockCondition: "20 metro or bus trips",
    iconName: "bus",
    category: "transport",
    colorClass: "bg-cyan-100 text-cyan-800",
    earnedDefault: false
  },
  {
    slug: "century",
    name: "Century",
    description: "100 kg saved vs baseline in a month",
    unlockCondition: "100 kg saved vs baseline in a month",
    iconName: "award",
    category: "system",
    colorClass: "bg-amber-100 text-amber-800",
    earnedDefault: false
  },
  {
    slug: "ctrlc_legend",
    name: "CtrlC legend",
    description: "All other badges earned",
    unlockCondition: "All other badges earned",
    iconName: "trophy",
    category: "system",
    colorClass: "bg-yellow-100 text-yellow-800",
    earnedDefault: false
  }
];

export const BadgesPage: React.FC = () => {
  const [earnedSlugs, setEarnedSlugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBadges = async () => {
    try {
      const res = await fetch(`/api/badges`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        // Extract slugs that are earned
        const earned = json.filter((b: any) => b.earned).map((b: any) => b.slug);
        
        // Ensure that our default earned badges are included in case DB is clean
        const finalEarned = Array.from(new Set([
          ...earned,
          ...BADGES_LIST.filter(b => b.earnedDefault).map(b => b.slug)
        ]));
        setEarnedSlugs(finalEarned);
      } else {
        fallbackToMock();
      }
    } catch (e) {
      console.warn("Failed to fetch badges, using defaults:", e);
      fallbackToMock();
    } finally {
      setLoading(false);
    }
  };

  const fallbackToMock = () => {
    setEarnedSlugs(BADGES_LIST.filter(b => b.earnedDefault).map(b => b.slug));
  };

  useEffect(() => {
    fetchBadges();
  }, []);

  const renderBadgeIcon = (iconName: string, isEarned: boolean) => {
    const size = "w-8 h-8";
    const color = isEarned ? "" : "text-outline-variant";

    switch (iconName) {
      case 'footprints':
        return <Footprints className={`${size} ${color}`} />;
      case 'train':
        return <Train className={`${size} ${color}`} />;
      case 'leaf':
        return <Leaf className={`${size} ${color}`} />;
      case 'flame':
        return <Flame className={`${size} ${color}`} />;
      case 'plane':
        return <Plane className={`${size} ${color}`} />;
      case 'users':
        return <Users className={`${size} ${color}`} />;
      case 'target':
        return <Target className={`${size} ${color}`} />;
      case 'salad':
        return <Salad className={`${size} ${color}`} />;
      case 'car_crossed':
        return (
          <div className="relative">
            <Car className={`${size} ${color}`} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-0.5 bg-outline-variant rotate-45 transform origin-center"></div>
            </div>
          </div>
        );
      case 'bus':
        return <Bus className={`${size} ${color}`} />;
      case 'award':
        return <Award className={`${size} ${color}`} />;
      case 'trophy':
        return <Trophy className={`${size} ${color}`} />;
      default:
        return <Award className={`${size} ${color}`} />;
    }
  };

  const earnedCount = BADGES_LIST.filter(b => earnedSlugs.includes(b.slug)).length;
  const lockedCount = BADGES_LIST.length - earnedCount;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background pb-[100px] md:pb-lg md:pl-64">
      {/* Header */}
      <header className="flex justify-between items-center w-full px-lg py-md border-b bg-surface-container-lowest border-surface-variant max-w-container-max mx-auto font-sans">
        <div>
          <h1 className="text-headline-md font-semibold text-primary">Your badges</h1>
          <p className="text-label-sm text-on-surface-variant font-bold uppercase tracking-wider mt-1">
            {loading ? 'Analyzing achievements...' : `${earnedCount} earned · ${lockedCount} to unlock`}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-md md:p-xl max-w-[800px] w-full mx-auto">
        {loading ? (
          <div className="flex justify-center py-xl">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-sm md:gap-md">
            {BADGES_LIST.map((badge) => {
              const isEarned = earnedSlugs.includes(badge.slug);
              return (
                <div 
                  key={badge.slug}
                  className={`bg-surface border rounded-lg p-sm md:p-md text-center flex flex-col items-center justify-between transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.02)] ${
                    isEarned ? 'border-surface-variant/80' : 'border-surface-variant/40 bg-surface-container-low/50 opacity-80'
                  }`}
                >
                  {/* Icon Square */}
                  <div className={`w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center relative mb-sm md:mb-md shrink-0 transition-colors ${
                    isEarned ? badge.colorClass : 'bg-surface-container-high text-outline-variant'
                  }`}>
                    {renderBadgeIcon(badge.iconName, isEarned)}
                    {!isEarned && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-surface border border-outline-variant flex items-center justify-center shadow-sm">
                        <Lock className="w-3 h-3 text-outline" />
                      </div>
                    )}
                  </div>

                  {/* Text Details */}
                  <div className="space-y-1">
                    <h3 className={`text-[12px] md:text-xs font-bold leading-tight font-sans transition-colors ${
                      isEarned ? 'text-primary' : 'text-on-surface-variant/80'
                    }`}>
                      {badge.name}
                    </h3>
                    <p className="text-[9px] md:text-[10px] text-on-surface-variant leading-tight max-w-[100px] mx-auto">
                      {isEarned ? badge.description : badge.unlockCondition}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default BadgesPage;
