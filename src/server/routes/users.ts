import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { startOfWeek, startOfMonth } from 'date-fns';

const router = Router();

// POST /api/users/onboarding
router.post('/onboarding', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, commuteType, dietType, homeEnergy, flightsPerYear } = req.body;

    // A placeholder logic for baseline calculation using quiz formula
    // For now we will mock a static baseline or simple heuristic
    let baselineAnnualKg = 2500; 
    if (dietType === 'vegan') baselineAnnualKg -= 500;
    if (commuteType === 'metro') baselineAnnualKg -= 300;

    const weeklyBudgetKg = (baselineAnnualKg / 52) * 0.85;

    await prisma.onboardingResponse.create({
      data: {
        userId,
        commuteType,
        dietType,
        homeEnergy,
        flightsPerYear,
        baselineAnnualKg
      }
    });

    await prisma.user.update({
      where: { id: userId },
      data: { weeklyBudgetKg }
    });

    res.status(200).json({ baselineAnnualKg, weeklyBudgetKg });
  } catch (error) {
    console.error('Onboarding Error:', error);
    res.status(500).json({ error: 'Failed to process onboarding' });
  }
});

// GET /api/dashboard?userId=
router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);

    const weekEntries = await prisma.entry.findMany({
      where: { userId, loggedAt: { gte: weekStart } }
    });

    const monthEntries = await prisma.entry.findMany({
      where: { userId, loggedAt: { gte: monthStart } }
    });

    const weekCurrentKg = weekEntries.reduce((sum: number, e: any) => sum + e.co2Kg, 0);
    const monthTotalKg = monthEntries.reduce((sum: number, e: any) => sum + e.co2Kg, 0);

    const recentEntries = await prisma.entry.findMany({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
      take: 5
    });

    const categoryBreakdown: Record<string, number> = {};
    weekEntries.forEach((e: any) => {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.co2Kg;
    });

    res.status(200).json({
      weeklyBudgetKg: user.weeklyBudgetKg,
      weekCurrentKg,
      monthTotalKg,
      streakDays: user.streakDays,
      friendRank: 3, // Mocked for now
      recentEntries,
      categoryBreakdown
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// GET /api/leaderboard?userId=
// Note: Route moved here as it logically relates to users, but could be its own file.
// The prompt had it as GET /api/leaderboard?userId=
router.get('/leaderboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId as string;
    // Mocked leaderboard for now
    res.status(200).json({
      leaderboard: [
        { name: 'Aditi', weekKg: 12.5, deltaKg: -2.1, isMe: false },
        { name: 'Kishlay', weekKg: 15.2, deltaKg: -0.5, isMe: true },
        { name: 'Rahul', weekKg: 18.0, deltaKg: +1.2, isMe: false },
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;
