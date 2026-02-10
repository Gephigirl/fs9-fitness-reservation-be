// TODO: 인증 관련 Zod 스키마 정의

import { z } from 'zod';

const phoneSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => /^\d{11}$/.test(v), {
    message: '전화번호는 숫자 11자리여야 합니다',
  });

export const signUpSchema = z.object({
  body: z.object({
    email: z.email({ message: '올바른 이메일 형식이어야 합니다' }),
    password: z.string().min(8, { message: '비밀번호는 8자 이상이어야 합니다' }),
    nickname: z.string().min(2, { message: '닉네임은 2자 이상이어야 합니다' }),
    phone: phoneSchema,
    role: z.enum(['CUSTOMER', 'SELLER']).optional().default('CUSTOMER'),
    center: z.object({
      name: z.string().min(1, '센터명은 필수입니다').max(100),
      address1: z.string().min(1, '도로명 주소는 필수입니다'),
      address2: z.string().optional(),
    }).optional(),
  }).refine(
    (data) => data.role !== 'SELLER' || !!data.center,
    { message: '판매자는 센터 정보를 입력해야 합니다', path: ['center'] }
  ),
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
    phone: phoneSchema.optional(),
  }),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;