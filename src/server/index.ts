import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import path from 'path';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';
const isProd = process.env.NODE_ENV === 'production';

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
}); 

app.set('trust proxy', 1); // Trust the first proxy (Render load balancer) required for secure session cookies

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(helmet()); // Set security headers
app.use(cookieParser()); // Parse cookies

// Global Rate Limiter: 100 requests per 15 minutes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', globalLimiter);

app.use(cors({
  origin: isProd
    ? [FRONTEND_URL]
    : [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));
app.use(express.json());

// Session required by Passport (and for storing OAuth CSRF state tokens)
app.use(session({
  secret: process.env.JWT_SECRET || 'ctrlc_dev_secret',
  resave: false,
  saveUninitialized: true,   // must be true so the state token is saved before the Google redirect
  cookie: { secure: isProd, sameSite: isProd ? 'none' : 'lax', maxAge: 10 * 60 * 1000 }, // 10 min — only needed for OAuth handshake
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
  console.log(`[server] Google Maps API: ${process.env.GOOGLE_MAPS_API_KEY ? 'configured' : 'NOT configured (add GOOGLE_MAPS_API_KEY to .env)'}`);
});
