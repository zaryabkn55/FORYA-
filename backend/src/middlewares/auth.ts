import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../env';

export const JWT_SECRET = env.jwtSecret;

export interface AuthRequest extends Request {
  user?: { id: string; email: string; name: string };
}

export const signToken = (u: { id: string; email: string; fullName: string }) =>
  jwt.sign({ id: u.id, email: u.email, name: u.fullName }, JWT_SECRET, { expiresIn: '30d' });

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Please log in to continue.' });
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET) as AuthRequest['user'];
    next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
}

/**
 * Guards the operator-only routes — catalogue ingest and live scraping. These spend
 * scraping credits and put load on retailers' sites, so they must never be reachable by
 * the public. Without ADMIN_TOKEN configured they are closed entirely rather than open:
 * a missing secret should fail shut, not fail open.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const configured = env.adminToken;
  if (!configured) {
    return res.status(503).json({ error: 'Administrative routes are disabled on this server.' });
  }
  const header = req.headers.authorization;
  const presented = header?.startsWith('Bearer ') ? header.slice(7) : String(req.headers['x-admin-token'] ?? '');
  if (!presented || !timingSafeEqual(presented, configured)) {
    return res.status(404).json({ error: 'Not found.' }); // don't advertise that the route exists
  }
  next();
}

/** Constant-time compare so the token can't be guessed a character at a time. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
