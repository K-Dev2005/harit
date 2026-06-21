import { Router, Request, Response } from 'express';
import { readDb } from '../db';
import { generateWeeklyInsight } from '../services/geminiService';
import { startOfWeek } from 'date-fns';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/insights/weekly
router.get('/weekly', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?.userId;

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    const store = readDb();
    const allEntries = store.entries.filter((e: any) => e.userId === userId);
    const weekEntries = allEntries.filter((e: any) => new Date(e.loggedAt) >= weekStart);

    const insight = await generateWeeklyInsight(weekEntries);

    res.status(200).json({ insight });
  } catch (error) {
    console.error('Insights Weekly Error:', error);
    res.status(500).json({ error: 'Failed to generate insight' });
  }
});

export default router;
