import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

export const prisma = new PrismaClient();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes will be imported here
import userRoutes from './routes/users';
import entryRoutes from './routes/entries';
import pledgeRoutes from './routes/pledges';
import actionRoutes from './routes/actions';
import insightRoutes from './routes/insights';
import badgeRoutes from './routes/badges';
import lookupRoutes from './routes/lookup';
import syncRoutes from './routes/sync';

app.use('/api/users', userRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/pledges', pledgeRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/lookup', lookupRoutes);
app.use('/api/sync', syncRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Basic Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
