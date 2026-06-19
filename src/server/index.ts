import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';
const isProd = process.env.NODE_ENV === 'production';

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors({
  origin: isProd
    ? [FRONTEND_URL]
    : [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));
app.use(express.json());

// Session required by Passport (even when using stateless JWTs, Passport needs it)
app.use(session({
  secret: process.env.JWT_SECRET || 'harit_dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: isProd, maxAge: 24 * 60 * 60 * 1000 }, // 1 day
}));
app.use(passport.initialize());
app.use(passport.session());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import entryRoutes from './routes/entries';
import pledgeRoutes from './routes/pledges';
import actionRoutes from './routes/actions';
import insightRoutes from './routes/insights';
import badgeRoutes from './routes/badges';
import lookupRoutes from './routes/lookup';
import syncRoutes from './routes/sync';

app.use('/auth', authRoutes);           // Google OAuth lives here
app.use('/api/users', userRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/pledges', pledgeRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/lookup', lookupRoutes);
app.use('/api/sync', syncRoutes);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ---------------------------------------------------------------------------
// Error handler
// ---------------------------------------------------------------------------
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[server error]', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`[server] Listening on port ${port}`);
  console.log(`[server] Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? 'enabled' : 'mock mode (add GOOGLE_CLIENT_ID to .env)'}`);
});
