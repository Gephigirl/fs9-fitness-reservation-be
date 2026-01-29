import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { env } from '../config/env.js';

export interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}


export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { message: '인증 토큰이 필요합니다' },
      });
    }

    const token = authHeader.substring(7); // Bearer 제거

    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      email: string;
      role: UserRole;
    };
 
    (req as AuthRequest).user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: { message: '토큰이 만료되었습니다' },
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: { message: '유효하지 않은 토큰입니다' },
      });
    }

    return res.status(401).json({
      success: false,
      error: { message: '인증에 실패했습니다' },
    });
  }
}


export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      return res.status(401).json({
        success: false,
        error: { message: '인증이 필요합니다' },
      });
    }

    if (!allowedRoles.includes(authReq.user.role)) {
      return res.status(403).json({
        success: false,
        error: { message: '권한이 없습니다' },
      });
    }

    next();
  };
}
