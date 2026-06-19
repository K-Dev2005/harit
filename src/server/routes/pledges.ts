import { Router, Request, Response } from 'express';
import { prisma } from '../index';
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

    const pledge = await prisma.pledge.create({
      data: {
        userId,
        actionCardId,
        verificationStatus: 'pending',
        pointsAwarded: POINTS_CONFIG.PLEDGE_COMMITTED
      }
    });

    const user = await prisma.user.update({
      where: { id: userId },
      data: { pointsTotal: { increment: POINTS_CONFIG.PLEDGE_COMMITTED } }
    });

    res.status(201).json({ pledge, pointsTotal: user.pointsTotal });
  } catch (error) {
    console.error('Create Pledge Error:', error);
    res.status(500).json({ error: 'Failed to create pledge' });
  }
});

export default router;
