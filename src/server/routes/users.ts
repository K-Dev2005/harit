import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { startOfWeek, startOfMonth } from 'date-fns';

const router = Router();

// ---------------------------------------------------------------------------
// JSON file store
// ---------------------------------------------------------------------------
const DB_FILE = path.resolve(process.cwd(), 'db.json');

interface DbStore {
  entries: any[];
  users: any[];
  [key: string]: any;
}

function readDb(): DbStore {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      users: Array.isArray(parsed.users) ? parsed.users : [],
    };
  } catch {
    return { entries: [], users: [] };
  }
}

function writeDb(data: DbStore): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('[db.json] Write failed:', e);
  }
}

// ---------------------------------------------------------------------------
// POST /api/users/onboarding
// ---------------------------------------------------------------------------
router.post('/onboarding', (req: Request, res: Response): void => {
  try {
    const { userId, commuteType, dietType, homeEnergy, flightsPerYear } = req.body;
    let baselineAnnualKg = 2500;
    if (dietType === 'vegan') baselineAnnualKg -= 500;
    if (commuteType === 'metro') baselineAnnualKg -= 300;
    const weeklyBudgetKg = parseFloat(((baselineAnnualKg / 52) * 0.85).toFixed(2));

    const store = readDb();
    const userIdx = store.users.findIndex((u: any) => u.id === userId);
    if (userIdx !== -1) {
      store.users[userIdx] = { ...store.users[userIdx], weeklyBudgetKg };
    } else {
      store.users.push({ id: userId || 'user_001', weeklyBudgetKg, streakDays: 0 });
    }
    writeDb(store);
    res.status(200).json({ baselineAnnualKg, weeklyBudgetKg });
  } catch (error) {
    console.error('Onboarding Error:', error);
    res.status(500).json({ error: 'Failed to process onboarding' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/users/dashboard?userId=
// ---------------------------------------------------------------------------
router.get('/dashboard', (req: Request, res: Response): void => {
  try {
    const userId = (req.query.userId as string) || 'user_001';
    const store = readDb();

    const user = store.users.find((u: any) => u.id === userId) || {
      id: userId,
      weeklyBudgetKg: 18,
      streakDays: 0,
    };

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);

    const allEntries: any[] = store.entries.filter((e: any) => e.userId === userId);
    const weekEntries = allEntries.filter((e: any) => new Date(e.loggedAt) >= weekStart);
    const monthEntries = allEntries.filter((e: any) => new Date(e.loggedAt) >= monthStart);

    const recentEntries = [...allEntries]
      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
      .slice(0, 5);

    const weekCurrentKg = weekEntries.reduce((sum: number, e: any) => sum + (Number(e.co2Kg) || 0), 0);
    const monthTotalKg = monthEntries.reduce((sum: number, e: any) => sum + (Number(e.co2Kg) || 0), 0);

    const categoryBreakdown: Record<string, number> = {};
    weekEntries.forEach((e: any) => {
      const cat = e.category || 'other';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + (Number(e.co2Kg) || 0);
    });

    res.status(200).json({
      weeklyBudgetKg: user.weeklyBudgetKg || 18,
      weekCurrentKg: parseFloat(weekCurrentKg.toFixed(2)),
      monthTotalKg: parseFloat(monthTotalKg.toFixed(2)),
      streakDays: user.streakDays || 0,
      friendRank: { position: 2, total: 5 },
      recentEntries,
      categoryBreakdown,
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/users/leaderboard
// ---------------------------------------------------------------------------
router.get('/leaderboard', (_req: Request, res: Response): void => {
  res.status(200).json({
    leaderboard: [
      { name: 'Aditi', weekKg: 12.5, deltaKg: -2.1, isMe: false },
      { name: 'Kishlay', weekKg: 15.2, deltaKg: -0.5, isMe: true },
      { name: 'Rahul', weekKg: 18.0, deltaKg: +1.2, isMe: false },
    ]
  });
});

export default router;
