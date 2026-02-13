import { z } from "zod";

export const createReviewSchema = z.object({
  body: z.object({
    reservationId: z.string().min(1, "예약 ID는 필수입니다"),
    rating: z.coerce
      .number()
      .int("별점은 정수여야 합니다")
      .min(1, "별점은 1점 이상이어야 합니다")
      .max(5, "별점은 5점 이하여야 합니다"),
    content: z
      .string()
      .max(1000, "리뷰 내용은 1000자 이하여야 합니다")
      .optional(),
    imgUrls: z.array(z.url("올바른 URL 형식이 아닙니다")).optional(),
  }),
});

export const updateReviewSchema = z.object({
  body: createReviewSchema.shape.body.omit({ reservationId: true }).partial(),
});

export const queryReviewSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  }),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>["body"];
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>["body"];
export type QueryReviewInput = z.infer<typeof queryReviewSchema>["query"];
