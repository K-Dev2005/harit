import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

function getJwtSecret() { return process.env.JWT_SECRET || 'ctrlc_dev_secret'; }

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface User {
      userId?: string;
      id?: string;
      email?: string;
      name?: string;
      [key: string]: any;
    }
    interface Request {
      user?: User;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // First check cookie, then fallback to Authorization header
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded as Express.User;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}
