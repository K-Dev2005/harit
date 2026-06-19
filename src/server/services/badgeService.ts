import { PrismaClient } from '@prisma/client';
import { POINTS_CONFIG } from '../../lib/points';
import { startOfWeek, subDays, startOfDay, isSameDay } from 'date-fns';

const prisma = new PrismaClient();

export const checkBadges = async (userId: string) => {
  const earnedBadges: string[] = [];

  const addBadge = async (slug: string) => {
    try {
      await prisma.badge.create({
        data: { userId, slug }
      });
      earnedBadges.push(slug);
    } catch (e) {
      // Ignore unique constraint violation if already earned
    }
  };

  // 1. first_step: count entries for user >= 1
  const entryCount = await prisma.entry.count({ where: { userId } });
  if (entryCount >= 1) await addBadge('first_step');

  // 2. metro_hero: count entries where subcategory = 'metro' >= 10
  const metroCount = await prisma.entry.count({
    where: { userId, subcategory: 'metro' }
  });
  if (metroCount >= 10) await addBadge('metro_hero');

  // 3. plant_week: 7 consecutive days where food entries sum < 1.5 kg/day
  // Approximation for demo: we just check last 7 days grouped by day
  const sevenDaysAgo = subDays(startOfDay(new Date()), 7);
  const foodEntries = await prisma.entry.findMany({
    where: {
      userId,
      category: 'food',
      loggedAt: { gte: sevenDaysAgo }
    }
  });
  
  // Aggregate by day
  const daySums: Record<string, number> = {};
  foodEntries.forEach((entry: any) => {
    const day = startOfDay(entry.loggedAt).toISOString();
    daySums[day] = (daySums[day] || 0) + entry.co2Kg;
  });

  const plantWeekPassed = Object.keys(daySums).length === 7 && Object.values(daySums).every(sum => sum < 1.5);
  if (plantWeekPassed) await addBadge('plant_week');

  // 4. week_warrior: streakDays >= 7
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user && user.streakDays >= 7) await addBadge('week_warrior');

  // 5. food_swap: count entries where subcategory in ['veg meal','vegan meal'] >= 10
  const vegCount = await prisma.entry.count({
    where: {
      userId,
      subcategory: { in: ['veg meal', 'vegan meal'] }
    }
  });
  if (vegCount >= 10) await addBadge('food_swap');

  // 6. green_commuter: count metro + bus entries >= 20
  const transitCount = await prisma.entry.count({
    where: {
      userId,
      subcategory: { in: ['metro', 'bus (city)'] }
    }
  });
  if (transitCount >= 20) await addBadge('green_commuter');

  // Note: budget_master and zero_cab_week left as placeholders for deeper aggregation

  return earnedBadges;
};
