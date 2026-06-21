import { Router, Request, Response } from 'express';
import dotenv from 'dotenv';
import { authMiddleware } from '../middleware/auth';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';

dotenv.config();

const router = Router();

const lookupLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // limit each IP to 15 lookup requests per windowMs
  message: { error: 'Too many lookup requests, please try again later.' }
});

const trainSchema = z.object({
  origin: z.string().min(1),
  destination: z.string().min(1),
});

const flightSchema = z.object({
  flightNumber: z.string().min(1),
});

// POST /api/lookup/train
router.post('/train', authMiddleware, lookupLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = trainSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Please enter both origin and destination cities.' });
      return;
    }
    const { origin, destination } = parsed.data;

    if (origin.trim().toLowerCase() === destination.trim().toLowerCase()) {
      res.status(400).json({ error: 'Origin and destination cannot be the same city.' });
      return;
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Google Maps API key is not configured.' });
      return;
    }

    // Distance Matrix API with driving mode — reliable proxy for rail distance
    // across all Indian city pairs.
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&mode=driving&key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Distance Matrix API HTTP error: ${response.status}`);
    }
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('[lookup/train] Distance Matrix status:', data.status, data.error_message);
      res.status(400).json({ error: `Could not calculate distance (${data.status}). Please try again.` });
      return;
    }

    const element = data.rows?.[0]?.elements?.[0];
    if (!element || element.status === 'ZERO_RESULTS') {
      res.status(400).json({ error: 'No route found between these cities. Try using the nearest major city.' });
      return;
    }

    if (element.status !== 'OK') {
      console.error('[lookup/train] Element status:', element.status);
      res.status(400).json({ error: 'Could not calculate distance. Please try again.' });
      return;
    }

    const distanceKm = Math.round(element.distance.value / 1000);
    res.status(200).json({ origin, destination, distanceKm });
  } catch (error) {
    console.error('Distance calculation error:', error);
    res.status(500).json({ error: 'Distance service unavailable. Please try again.' });
  }
});

// POST /api/lookup/flight
router.post('/flight', authMiddleware, lookupLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = flightSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'flightNumber is required' });
      return;
    }
    const { flightNumber } = parsed.data;

    const upper = flightNumber.toUpperCase();
    let airline = "Generic Airlines";
    if (upper.startsWith('6E')) airline = "IndiGo";
    else if (upper.startsWith('AI')) airline = "Air India";
    else if (upper.startsWith('UK')) airline = "Vistara";
    else if (upper.startsWith('SG')) airline = "SpiceJet";
    else if (upper.startsWith('QP')) airline = "Akasa Air";
    else if (upper.startsWith('I5')) airline = "AIX Connect";

    // Generate deterministic mock based on flight number hash
    const flightRoutes = [
      { route: "Delhi (DEL) → Mumbai (BOM)", dist: 1148 },
      { route: "Bengaluru (BLR) → Delhi (DEL)", dist: 1740 },
      { route: "Mumbai (BOM) → Goa (GOI)", dist: 425 },
      { route: "Kolkata (CCU) → Delhi (DEL)", dist: 1305 },
      { route: "Chennai (MAA) → Bengaluru (BLR)", dist: 268 },
      { route: "Hyderabad (HYD) → Pune (PNQ)", dist: 504 }
    ];
    const hash = flightNumber.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const selected = flightRoutes[hash % flightRoutes.length];

    res.status(200).json({
      route: selected.route,
      airline: airline,
      distanceKm: selected.dist
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to lookup flight' });
  }
});

export default router;
