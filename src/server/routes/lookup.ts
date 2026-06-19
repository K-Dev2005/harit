import { Router, Request, Response } from 'express';

const router = Router();

// POST /api/lookup/pnr
router.post('/pnr', async (req: Request, res: Response): Promise<void> => {
  try {
    const { pnr } = req.body;
    if (!pnr) {
      res.status(400).json({ error: 'pnr is required' });
      return;
    }
    
    // Mock response
    res.status(200).json({
      origin: "New Delhi",
      destination: "Amritsar",
      trainName: "Shatabdi Express",
      distanceKm: 446
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to lookup PNR' });
  }
});

// POST /api/lookup/flight
router.post('/flight', async (req: Request, res: Response): Promise<void> => {
  try {
    const { flightNumber } = req.body;
    if (!flightNumber) {
      res.status(400).json({ error: 'flightNumber is required' });
      return;
    }

    // Mock response
    res.status(200).json({
      origin: "Delhi",
      destination: "Mumbai",
      originCode: "DEL",
      destinationCode: "BOM",
      airline: "IndiGo",
      distanceKm: 1150
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to lookup flight' });
  }
});

export default router;
