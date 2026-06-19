import { Router, Request, Response } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env before reading any process.env values
dotenv.config();

const router = Router();
const DB_FILE = path.resolve(process.cwd(), 'db.json');

// Read lazily after dotenv has loaded
function getJwtSecret() { return process.env.JWT_SECRET || 'harit_dev_secret'; }
function getFrontendUrl() { return process.env.FRONTEND_URL || 'http://localhost:5174'; }

// ---------------------------------------------------------------------------
// db.json helpers
// ---------------------------------------------------------------------------
interface HaritUser {
  id: string;
  googleId?: string;
  name: string;
  email: string;
  avatar?: string;
  weeklyBudgetKg: number;
  streakDays: number;
  pointsTotal: number;
  createdAt: string;
}

function readDb(): { users: HaritUser[]; entries: any[]; [key: string]: any } {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      users: Array.isArray(parsed.users) ? parsed.users : [],
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
    };
  } catch {
    return { users: [], entries: [] };
  }
}

function writeDb(data: any): void {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// Google OAuth Strategy — only register if credentials are present
// ---------------------------------------------------------------------------
// Read credentials after dotenv has loaded
const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
const hasGoogleCreds = Boolean(
  googleClientId &&
  googleClientId !== 'your_google_client_id_here' &&
  googleClientSecret &&
  googleClientSecret !== 'your_google_client_secret_here'
);

console.log(`[auth] Google Client ID detected: ${googleClientId ? googleClientId.slice(0, 20) + '...' : 'NONE'}`);
console.log(`[auth] hasGoogleCreds = ${hasGoogleCreds}`);

if (hasGoogleCreds) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: `${process.env.APP_URL || 'http://localhost:3001'}/auth/google/callback`,
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: (err: any, user?: any) => void
      ) => {
        try {
          const store = readDb();
          let user = store.users.find((u) => u.googleId === profile.id);

          if (!user) {
            // First-time Google login — create account
            user = {
              id: `user_${Date.now()}`,
              googleId: profile.id,
              name: profile.displayName || 'Harit User',
              email: profile.emails?.[0]?.value || '',
              avatar: profile.photos?.[0]?.value || '',
              weeklyBudgetKg: 18,
              streakDays: 0,
              pointsTotal: 0,
              createdAt: new Date().toISOString(),
            };
            store.users.push(user);
            writeDb(store);
            console.log(`[auth] New user created via Google: ${user.name} (${user.id})`);
          } else {
            console.log(`[auth] Existing user signed in: ${user.name} (${user.id})`);
          }

          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );
} else {
  console.warn('[auth] Google OAuth credentials not set — /auth/google will return mock token');
}

// Passport serialize/deserialize (needed even with session: false for middleware)
passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser((id: string, done) => {
  const store = readDb();
  const user = store.users.find((u) => u.id === id);
  done(null, user || null);
});

// ---------------------------------------------------------------------------
// Helper: issue a signed JWT for a user
// ---------------------------------------------------------------------------
function issueToken(user: HaritUser): string {
  return jwt.sign(
    {
      userId: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || '',
    },
    getJwtSecret(),
    { expiresIn: '30d' }
  );
}

// ---------------------------------------------------------------------------
// GET /auth/google  — redirect user to Google consent screen
// ---------------------------------------------------------------------------
router.get('/google', (req: Request, res: Response) => {
  if (!hasGoogleCreds) {
    // Dev shortcut: issue a mock token and redirect straight to dashboard
    console.warn('[auth] No Google creds — issuing mock token for dev');
    const store = readDb();
    let devUser = store.users.find((u) => u.id === 'user_001');
    if (!devUser) {
      devUser = {
        id: 'user_001',
        name: 'Dev User',
        email: 'dev@harit.app',
        weeklyBudgetKg: 18,
        streakDays: 0,
        pointsTotal: 0,
        createdAt: new Date().toISOString(),
      };
      store.users.push(devUser);
      writeDb(store);
    }
    const token = issueToken(devUser);
    return res.redirect(
      `${getFrontendUrl()}/dashboard?token=${token}&userId=${devUser.id}&name=${encodeURIComponent(devUser.name)}`
    );
  }

  // Real Google OAuth flow
  return passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })(req, res);
});

// ---------------------------------------------------------------------------
// GET /auth/google/callback  — Google redirects here after user consent
// ---------------------------------------------------------------------------
router.get(
  '/google/callback',
  (req: Request, res: Response, next) => {
    if (!hasGoogleCreds) {
      res.redirect(`${getFrontendUrl()}/signin?error=no_credentials`);
      return;
    }
    passport.authenticate('google', { session: false, failureRedirect: `${getFrontendUrl()}/signin?error=oauth_failed` })(
      req,
      res,
      next
    );
  },
  (req: Request, res: Response) => {
    const user = req.user as HaritUser;
    const token = issueToken(user);
    res.redirect(
      `${getFrontendUrl()}/dashboard?token=${token}&userId=${user.id}&name=${encodeURIComponent(user.name)}`
    );
  }
);

// ---------------------------------------------------------------------------
// POST /auth/verify  — validate a JWT (used by frontend on load)
// ---------------------------------------------------------------------------
router.post('/verify', (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) { res.status(400).json({ error: 'token required' }); return; }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any;
    res.status(200).json({ valid: true, userId: decoded.userId, name: decoded.name, email: decoded.email });
  } catch {
    res.status(401).json({ valid: false, error: 'Invalid or expired token' });
  }
});

// ---------------------------------------------------------------------------
// POST /auth/logout  — client just deletes token, but provide a server endpoint
// ---------------------------------------------------------------------------
router.post('/logout', (_req: Request, res: Response) => {
  res.status(200).json({ message: 'Logged out — delete token from localStorage' });
});

export default router;
export { issueToken, hasGoogleCreds };
