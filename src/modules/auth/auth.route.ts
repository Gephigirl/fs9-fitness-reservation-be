// TODO: 인증 라우트 구현

import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.ts';
import { validate } from '../../middlewares/validate.ts';
import {
  signupHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  getUserByIdHandler,
  updateUserHandler,
} from './auth.controller.ts';
import { signUpSchema, updateUserSchema, signInSchema } from './auth.validation.ts';

const router = Router();

// POST /auth/signup - 회원가입
router.post('/signup', validate(signUpSchema), signupHandler);

// POST /auth/login - 로그인
router.post('/login', validate(signInSchema), loginHandler);

// POST /auth/refresh - 토큰 갱신(쿠키 기반)
router.post('/refresh', refreshHandler);

// POST /auth/logout - 로그아웃(쿠키 제거)
router.post('/logout', logoutHandler);

// GET /auth/me - 유저 정보 조회
router.get('/me', authenticate, getUserByIdHandler);

// PUT /auth/me - 유저 정보 수정
router.put('/me', authenticate, validate(updateUserSchema), updateUserHandler);


export default router;