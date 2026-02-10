// TODO: AuthController 구현

import type { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.ts';
import * as centerService from '../center/center.service.ts';


export async function signupHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { center: centerData, ...userData } = req.body;
    const user = await authService.createUser(userData);

    let center = null;
    if (userData.role === 'SELLER' && centerData) {
      center = await centerService.createCenter(user.id, centerData);
    }

    res.status(201).json({
      success: true,
      data: { ...user, center },
    });
  } catch (error) {
    next(error);
  }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await authService.signIn(email, password);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = (req.params.id || (req as any).user?.id) as string;
    const user = await authService.getUserById(id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const user = await authService.updateUser(id, req.body as any);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  signupHandler,
  loginHandler,
  getUserByIdHandler,
  updateUserHandler,
};