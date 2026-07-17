import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { createError } from './errorHandler';
import { logger } from '../config/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    username: string;
  };
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('No authorization token provided', 401);
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'fallback-secret';

    const decoded = jwt.verify(token, secret) as {
      id: string;
      email: string;
      role: string;
      username: string;
    };

    // Verify user still exists and is active
    const user = await User.findById(decoded.id).select('_id email role username isActive');
    if (!user || !user.isActive) {
      throw createError('User not found or account disabled', 401);
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      username: user.username,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(createError('Token expired', 401));
    } else {
      next(error);
    }
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(createError('Authentication required', 401));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(createError('Insufficient permissions', 403));
      return;
    }
    next();
  };
}
