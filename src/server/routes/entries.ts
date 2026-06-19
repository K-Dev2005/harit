import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { parseEntryText } from '../services/geminiService';
import { checkBadges } from '../services/badgeService';
import { startOfDay, subDays, isSameDay } from 'date-fns';

const router = Router();

// POST /api/entries/parse
router.post('/parse', async (req: Request, res: Response): Promise<void> => {
  try {
    const { text } = req.body;
    if (!text) {
      res.status(400).json({ error: 'text is required' });
      return;
    }

    const parsed = await parseEntryText(text);
    res.status(200).json(parsed);
  } catch (error) {
    console.error('Parse Error:', error);
    res.status(500).json({ error: 'Failed to parse text' });
  }
});

// POST /api/entries
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, category, subcategory, description, distanceKm, quantity, unit, co2Kg, source, rawInput } = req.body;

    const entry = await prisma.entry.create({
      data: {
        userId, category, subcategory, description, distanceKm, quantity, unit, co2Kg, source, rawInput
      }
    });

    // Update streak logic
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      const today = startOfDay(new Date());
      let newStreak = user.streakDays;
      let newLastLogged = user.streakLastLogged;

      if (!user.streakLastLogged) {
        newStreak = 1;
        newLastLogged = today;
      } else {
        const lastLogged = startOfDay(new Date(user.streakLastLogged));
        if (isSameDay(lastLogged, today)) {
          // Already logged today, streak remains same
        } else if (isSameDay(lastLogged, subDays(today, 1))) {
          // Logged yesterday, increment
          newStreak += 1;
          newLastLogged = today;
        } else {
          // Missed a day, reset
          newStreak = 1;
          newLastLogged = today;
        }
      }

      await prisma.user.update({
        where: { id: userId },
        data: { streakDays: newStreak, streakLastLogged: newLastLogged }
      });
    }

    const badgesEarned = await checkBadges(userId);

    res.status(201).json({ entry, badgesEarned });
  } catch (error) {
    console.error('Create Entry Error:', error);
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

// GET /api/entries
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId as string;
    const category = req.query.category as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    const where: any = { userId };
    if (category) where.category = category;

    const entries = await prisma.entry.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { loggedAt: 'desc' }
    });

    res.status(200).json({ entries, page });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// DELETE /api/entries/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // For soft delete, we'd add deletedAt column to schema. 
    // Since schema didn't have deletedAt, we do hard delete or update.
    // Assuming hard delete for now to match schema.
    await prisma.entry.delete({ where: { id: id as string } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

export default router;
