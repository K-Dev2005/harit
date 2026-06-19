import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { generateActionCards } from '../services/geminiService';
import { startOfWeek } from 'date-fns';

const router = Router();

// GET /api/actions/weekly?userId=
router.get('/weekly', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    const now = new Date();
    // Normally we'd check if today is Monday and no cards generated this week.
    // For demo purposes, we will just call Gemini directly.
    const recentEntries = await prisma.entry.findMany({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
      take: 20
    });

    const categoryBreakdown: Record<string, number> = {};
    recentEntries.forEach((e: any) => {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.co2Kg;
    });

    const cards = await generateActionCards(categoryBreakdown);

    res.status(200).json({ cards });
  } catch (error) {
    console.error('Actions Weekly Error:', error);
    res.status(500).json({ error: 'Failed to fetch weekly actions' });
  }
});

export default router;
