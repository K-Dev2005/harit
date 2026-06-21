import { Router, Request, Response } from 'express';
import { readDb } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const ALL_BADGES = [
  'first_step', 'metro_hero', 'plant_week', 'week_warrior',
  'budget_master', 'food_swap', 'zero_cab_week', 'green_commuter'
];

// GET /api/badges
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?.userId;

    const store = readDb();
    const earned = store.badges.filter((b: any) => b.userId === userId);

    const earnedMap = new Map();
    earned.forEach((b: any) => earnedMap.set(b.slug, b.earnedAt));

    const badges = ALL_BADGES.map(slug => ({
      slug,
      earned: earnedMap.has(slug),
      earnedAt: earnedMap.get(slug) || null
    }));

    res.setHeader('Cache-Control', 'private, max-age=60');
    res.status(200).json(badges);
  } catch (error) {
    console.error('Fetch Badges Error:', error);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

export default router;
