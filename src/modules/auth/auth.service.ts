import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authRepo from './auth.repository.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middlewares/errorHandler.js';

async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function createUser(user: any) {
  const existingUser = await authRepo.findByEmail(user.email);
  if (existingUser) {
    throw new AppError(409, '이미 존재하는 이메일입니다.');
  }

  const hashedPassword = await hashPassword(user.password);
  const createdUser = await authRepo.save({
    ...user,
    password: hashedPassword,
  });
  return filterSensitiveUserData(createdUser);
}

async function verifyPassword(inputPassword: string, password: string) {
  const isMatch = await bcrypt.compare(inputPassword, password);
  if (!isMatch) {
    throw new AppError(401, '비밀번호가 틀렸습니다.');
  }
}

function filterSensitiveUserData(user: any) {
  const { password: _password, ...rest } = user;
  return rest;
}

function createToken(user: any, type: 'access' | 'refresh') {
  const payload = { id: user.id, email: user.email, role: user.role };
  const secret = type === 'refresh' ? env.JWT_REFRESH_SECRET : env.JWT_SECRET;
  const expiresIn = type === 'refresh' ? '2w' : '1h';
  return jwt.sign(payload, secret as string, { expiresIn });
}

export async function signIn(email: string, password: string) {
  const user = await authRepo.findByEmail(email);
  
  if (!user) {
    throw new AppError(404, '존재하지 않는 이메일입니다.');
  }

  await verifyPassword(password, user.password);

  const accessToken = createToken(user, 'access');
  const refreshToken = createToken(user, 'refresh');


  return {
    user: filterSensitiveUserData(user),
    accessToken,
    refreshToken,
  };
}

export async function refreshToken(userId: string, receivedToken: string) {
  const user = await authRepo.findById(userId);

  if (!user) {
    throw new AppError(401, '인증 정보가 없습니다. 다시 로그인해 주세요.');
  }
  
  try {
    jwt.verify(receivedToken, env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new AppError(403, '유효하지 않은 리프레시 토큰입니다.');
  }

  const newAccessToken = createToken(user, 'access');
  const newRefreshToken = createToken(user, 'refresh');

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

export async function signOut(userId: string) {
  void userId;
}

export async function getUserById(id: string) {
  const user = await authRepo.findById(id);
  if (!user) {
    throw new AppError(404, '존재하지 않는 유저입니다.');
  }
  return filterSensitiveUserData(user);
}

export async function updateUser(id: string, data: any) {
  const updatedUser = await authRepo.update(id, data);
  return filterSensitiveUserData(updatedUser);
}
