import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index';
import { JwtPayload } from '../types/index';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  cookies: { [key: string]: string };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.auth_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
}

export function optionalAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.auth_token;

    if (token) {
      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Token invalid, continue without user
    next();
  }
}

export function generateToken(payload: JwtPayload): string {
  const expiresInSeconds = 7 * 24 * 60 * 60; // 7 days in seconds
  return jwt.sign(payload as object, config.jwtSecret, {
    expiresIn: expiresInSeconds,
  });
}
