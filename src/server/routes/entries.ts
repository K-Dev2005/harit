import { Router, Request, Response } from 'express';
import { readDb, writeDb } from '../db';
import { parseEntryText } from '../services/geminiService';
import { startOfWeek, startOfMonth } from 'date-fns';
import { authMiddleware } from '../middleware/auth';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';

const router = Router();

const parseLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // limit each IP to 15 parse requests per windowMs
  message: { error: 'Too many parse requests, please try again later.' }
});

const entrySchema = z.object({
  category: z.string().default('other'),
  subcategory: z.string().default('general'),
  description: z.string().optional(),
  distanceKm: z.number().optional(),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  co2Kg: z.number().min(0).default(0),
  source: z.string().default('ai'),
  rawInput: z.string().optional(),
});

function generateId(): string {
  return `e_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ---------------------------------------------------------------------------
// POST /api/entries/parse
// ---------------------------------------------------------------------------
router.post('/parse', authMiddleware, parseLimiter, async (req: Request, res: Response): Promise<void> => {
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

// ---------------------------------------------------------------------------
// POST /api/entries  — save to db.json
// ---------------------------------------------------------------------------
router.post('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req.user as any)?.userId;
    const validated = entrySchema.parse(req.body);

    const store = readDb();

    const newEntry = {
      id: generateId(),
      userId,
      ...validated,
      loggedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    store.entries.push(newEntry);

    // Update streak on the user record in db.json
    const userIdx = store.users.findIndex((u: any) => u.id === userId);
    if (userIdx !== -1) {
      const user = store.users[userIdx];
      const today = new Date().toISOString().split('T')[0];
      const lastLogged = user.streakLastLogged || null;
      if (!lastLogged) {
        store.users[userIdx] = { ...user, streakDays: 1, streakLastLogged: today };
      } else if (lastLogged !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const newStreak = lastLogged === yesterday ? (user.streakDays || 0) + 1 : 1;
        store.users[userIdx] = { ...user, streakDays: newStreak, streakLastLogged: today };
      }
    }

    writeDb(store);
    console.log(`[entries] Saved entry ${newEntry.id} (${validated.category}, ${validated.co2Kg} kg) to db.json`);
    res.status(201).json({ entry: newEntry, badgesEarned: [] });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: (error as any).errors });
      return;
    }
    console.error('Create Entry Error:', error);
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/entries
// ---------------------------------------------------------------------------
router.get('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req.user as any)?.userId;
    const category = req.query.category as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;

    const store = readDb();
    let entries = store.entries.filter((e: any) => e.userId === userId);
    if (category) entries = entries.filter((e: any) => e.category === category);
    entries.sort((a: any, b: any) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
    const paginated = entries.slice((page - 1) * limit, page * limit);

    res.setHeader('Cache-Control', 'private, max-age=30');
    res.status(200).json({ entries: paginated, page });
  } catch (error) {
    console.error('Fetch Entries Error:', error);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/entries/:id
// ---------------------------------------------------------------------------
router.delete('/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const userId = (req.user as any)?.userId;
    const store = readDb();
    
    const entry = store.entries.find((e: any) => e.id === id);
    if (!entry) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    if (entry.userId !== userId) {
      res.status(403).json({ error: 'Forbidden: Cannot delete other user\'s entry' });
      return;
    }

    store.entries = store.entries.filter((e: any) => e.id !== id);
    writeDb(store);
    res.status(204).send();
  } catch (error) {
    console.error('Delete Entry Error:', error);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

export default router;
