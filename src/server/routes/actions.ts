import { Router, Request, Response } from 'express';
import { readDb } from '../db';
import { generateActionCards } from '../services/geminiService';
import { startOfWeek } from 'date-fns';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/actions/weekly
router.get('/weekly', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?.userId;

    const now = new Date();
    // Normally we'd check if today is Monday and no cards generated this week.
    // For demo purposes, we will just call Gemini directly.
    const store = readDb();
    const allEntries = store.entries.filter((e: any) => e.userId === userId);
    const recentEntries = allEntries
      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
      .slice(0, 20);

    const categoryBreakdown: Record<string, number> = {};
    recentEntries.forEach((e: any) => {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.co2Kg;
    });

    const cards = await generateActionCards(categoryBreakdown);

    res.setHeader('Cache-Control', 'private, max-age=300');
    res.status(200).json({ cards });
  } catch (error) {
    console.error('Actions Weekly Error:', error);
    res.status(500).json({ error: 'Failed to fetch weekly actions' });
  }
});

export default router;
