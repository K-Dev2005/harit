import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { parseEntryText } from '../services/geminiService';
import { startOfWeek, startOfMonth } from 'date-fns';

const router = Router();

// ---------------------------------------------------------------------------
// Simple JSON file store — no Prisma required
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

function generateId(): string {
  return `e_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ---------------------------------------------------------------------------
// POST /api/entries/parse
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// POST /api/entries  — save to db.json
// ---------------------------------------------------------------------------
router.post('/', (req: Request, res: Response): void => {
  try {
    const {
      userId = 'user_001',
      category = 'other',
      subcategory = 'general',
      description = '',
      distanceKm,
      quantity,
      unit,
      co2Kg = 0,
      source = 'ai',
      rawInput,
    } = req.body;

    const store = readDb();

    const newEntry = {
      id: generateId(),
      userId,
      category,
      subcategory,
      description,
      distanceKm: distanceKm !== undefined ? Number(distanceKm) : null,
      quantity: quantity !== undefined ? Number(quantity) : null,
      unit: unit || null,
      co2Kg: Number(co2Kg) || 0,
      source,
      rawInput: rawInput || null,
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
    console.log(`[entries] Saved entry ${newEntry.id} (${category}, ${co2Kg} kg) to db.json`);
    res.status(201).json({ entry: newEntry, badgesEarned: [] });
  } catch (error) {
    console.error('Create Entry Error:', error);
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/entries
// ---------------------------------------------------------------------------
router.get('/', (req: Request, res: Response): void => {
  try {
    const userId = (req.query.userId as string) || 'user_001';
    const category = req.query.category as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;

    const store = readDb();
    let entries = store.entries.filter((e: any) => e.userId === userId);
    if (category) entries = entries.filter((e: any) => e.category === category);
    entries.sort((a: any, b: any) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
    const paginated = entries.slice((page - 1) * limit, page * limit);

    res.status(200).json({ entries: paginated, page });
  } catch (error) {
    console.error('Fetch Entries Error:', error);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/entries/:id
// ---------------------------------------------------------------------------
router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const store = readDb();
    store.entries = store.entries.filter((e: any) => e.id !== id);
    writeDb(store);
    res.status(204).send();
  } catch (error) {
    console.error('Delete Entry Error:', error);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

export default router;
