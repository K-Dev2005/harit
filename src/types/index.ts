export interface User {
  id: string;
  email?: string | null;
  phone?: string | null;
  googleId?: string | null;
  name: string;
  avatarUrl?: string | null;
  weeklyBudgetKg: number;
  pointsTotal: number;
  streakDays: number;
  streakLastLogged?: string | null;
  createdAt: string;
}

export interface Entry {
  id: string;
  userId: string;
  category: string;
  subcategory?: string | null;
  description: string;
  distanceKm?: number | null;
  quantity?: number | null;
  unit?: string | null;
  co2Kg: number;
  source: string;
  rawInput?: string | null;
  loggedAt: string;
  createdAt: string;
}

export interface OnboardingResponse {
  id: string;
  userId: string;
  commuteType: string;
  dietType: string;
  homeEnergy: string;
  flightsPerYear: string;
  baselineAnnualKg: number;
  createdAt: string;
}

export interface Pledge {
  id: string;
  userId: string;
  actionCardId: string;
  committedAt: string;
  verificationStatus: string;
  verifiedAt?: string | null;
  pointsAwarded: number;
}

export interface Badge {
  id: string;
  userId: string;
  slug: string;
  earnedAt: string;
}

export interface DashboardData {
  weeklyBudgetKg: number;
  weekCurrentKg: number;
  monthTotalKg: number;
  streakDays: number;
  friendRank: number | { position: number; total: number };
  recentEntries: Entry[];
  categoryBreakdown: Record<string, number>;
}
