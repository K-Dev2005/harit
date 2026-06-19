import { Router, Request, Response } from 'express';
import { readDb, writeDb } from '../db';
import { POINTS_CONFIG } from '../../lib/points';

const router = Router();

// POST /api/pledges
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, actionCardId } = req.body;
    if (!userId || !actionCardId) {
      res.status(400).json({ error: 'userId and actionCardId are required' });
      return;
    }

    const store = readDb();
    
    const pledge = {
      id: `pledge_${Date.now()}`,
      userId,
      actionCardId,
      verificationStatus: 'pending',
      pointsAwarded: POINTS_CONFIG.PLEDGE_COMMITTED,
      committedAt: new Date().toISOString()
    };
    
    if (!store.pledges) store.pledges = [];
    store.pledges.push(pledge);

    let user = store.users.find((u: any) => u.id === userId);
    if (user) {
      user.pointsTotal = (user.pointsTotal || 0) + POINTS_CONFIG.PLEDGE_COMMITTED;
    } else {
      user = { id: userId, pointsTotal: POINTS_CONFIG.PLEDGE_COMMITTED, streakDays: 0 };
      store.users.push(user);
    }
    
    writeDb(store);

    res.status(201).json({ pledge, pointsTotal: user.pointsTotal });
  } catch (error) {
    console.error('Create Pledge Error:', error);
    res.status(500).json({ error: 'Failed to create pledge' });
  }
});

export default router;
