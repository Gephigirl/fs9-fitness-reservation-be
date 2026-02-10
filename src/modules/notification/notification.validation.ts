import { z } from "zod";

const linkUrlSchema = z
  .string()
  .min(1)
  .refine(
    (v) => v.startsWith("/") || /^https?:\/\//.test(v),
    "linkUrl은 '/'로 시작하는 경로이거나 http(s) URL이어야 합니다",
  );

export const createNotificationSchema = z.object({
  body: z.object({
    userId: z.string().min(1, "userId는 필수입니다"),
    title: z.string().min(1, "title은 필수입니다").max(100, "title은 100자 이내여야 합니다"),
    body: z.string().max(2000, "body는 2000자 이내여야 합니다").optional(),
    linkUrl: linkUrlSchema.optional(),
  }),
});

export const listNotificationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    // ADMIN 전용: 특정 유저 알림 조회
    userId: z.string().min(1).optional(),
  }),
});

export const notificationIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "id는 필수입니다"),
  }),
});

export const updateNotificationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "id는 필수입니다"),
  }),
  body: z
    .object({
      title: z.string().min(1).max(100).optional(),
      body: z.string().max(2000).optional(),
      linkUrl: linkUrlSchema.optional(),
    })
    .refine((v) => Object.keys(v).length > 0, "수정할 필드가 필요합니다"),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>["body"];
export type ListNotificationsQuery = z.infer<typeof listNotificationsSchema>["query"];
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>["body"];
