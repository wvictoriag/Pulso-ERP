import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  user?: DecodedIdToken & {
    role?: string;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Obtener rol del usuario desde la base de datos PostgreSQL
    const dbUser = await db.select().from(users).where(eq(users.uid, decodedToken.uid)).limit(1);
    
    let role = 'user';
    if (dbUser[0]) {
      role = dbUser[0].role || 'user';
    }
    
    req.user = {
      ...decodedToken,
      role,
    };
    
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: 'Forbidden: No role assigned' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};
