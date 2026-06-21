import { Router, Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();

// POST /api/lookup/train
router.post('/train', async (req: Request, res: Response): Promise<void> => {
  try {
    const { origin, destination } = req.body;
    if (!origin || !destination) {
      res.status(400).json({ error: 'Please enter both origin and destination cities.' });
      return;
    }

    if (origin.trim().toLowerCase() === destination.trim().toLowerCase()) {
      res.status(400).json({ error: 'Origin and destination cannot be the same city.' });
      return;
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Google Maps API key is not configured.' });
      return;
    }

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&mode=transit&key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Distance Matrix API error: ${response.status}`);
    }
    const data = await response.json();

    if (data.status !== "OK") {
      res.status(400).json({ error: 'Could not calculate distance. Please try again.' });
      return;
    }

    const element = data.rows?.[0]?.elements?.[0];
    if (!element || element.status === "ZERO_RESULTS") {
      res.status(400).json({ error: 'No transit route found between these cities. Try checking the city names or use a nearby major city.' });
      return;
    }

    if (element.status !== "OK") {
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
router.post('/flight', async (req: Request, res: Response): Promise<void> => {
  try {
    const { flightNumber } = req.body;
    if (!flightNumber) {
      res.status(400).json({ error: 'flightNumber is required' });
      return;
    }

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
