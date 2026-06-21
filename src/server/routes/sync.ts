import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// POST /api/sync/:source
router.post('/:source', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { source } = req.params;
    
    // Mock implementation returning fake unlogged entries
    const previewEntries = [
      { category: 'transport', subcategory: 'uber', description: `${source} ride to office`, distanceKm: 8, co2Kg: 1.68, source },
      { category: 'food', subcategory: 'non-veg meal', description: `${source} - Biryani`, quantity: 1, co2Kg: 3.05, source },
      { category: 'transport', subcategory: 'uber', description: `${source} ride home`, distanceKm: 9, co2Kg: 1.89, source },
    ];

    res.status(200).json({ previewEntries });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync source' });
  }
});

export default router;
