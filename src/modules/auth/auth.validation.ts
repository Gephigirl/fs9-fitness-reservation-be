// TODO: 인증 관련 Zod 스키마 정의

import { z } from 'zod';

export const signUpSchema = z.object({
  body: z.object({
    email: z.string().email({ message: '올바른 이메일 형식이어야 합니다' }),
    password: z.string().min(8, { message: '비밀번호는 8자 이상이어야 합니다' }),
    nickname: z.string().min(2, { message: '닉네임은 2자 이상이어야 합니다' }),
    phone: z.string().min(10, { message: '전화번호는 10자 이상이어야 합니다' }),
    role: z.enum(['CUSTOMER', 'SELLER']).optional().default('CUSTOMER'),
  }),
});

export const signInSchema = z.object({
  body: z.object({
    email: z.string().email({ message: '올바른 이메일 형식이어야 합니다' }),
    password: z.string().min(8, { message: '비밀번호는 8자 이상이어야 합니다' }),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    email: z.string().email({ message: '올바른 이메일 형식이어야 합니다' }).optional(),
    password: z.string().min(8, { message: '비밀번호는 8자 이상이어야 합니다' }).optional(),
    nickname: z.string().min(2, { message: '닉네임은 2자 이상이어야 합니다' }).optional(),
    phone: z.string().min(10, { message: '전화번호는 10자 이상이어야 합니다' }).optional(),
  }),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;