import type { Request, Response, NextFunction } from "express";
import * as reviewService from "./review.service.ts";
import type { AuthRequest } from "../../middlewares/auth.ts";
import { AppError } from "../../middlewares/errorHandler.ts";
import {
  createReviewSchema,
  updateReviewSchema,
  queryReviewSchema,
} from "./review.validation.ts";

// [고객] 리뷰 생성 핸들러
export async function createReviewHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    if (!userId) {
      throw new AppError(401, "인증이 필요합니다", "UNAUTHORIZED");
    }

    const input = createReviewSchema.parse(req.body);

    const review = await reviewService.createReview(userId, input);

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
}

// [공통] 센터별 리뷰 목록 조회 핸들러
export async function getReviewsByCenterHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { centerId } = req.params;
    
    // Query String 파싱
    const query = queryReviewSchema.parse(req.query);
    const page = query.page;
    const limit = query.limit;

    if (!centerId) {
      throw new AppError(400, "센터 ID는 필수입니다", "INVALID_INPUT");
    }

    const result = await reviewService.getReviewsByCenter(
      centerId as string,
      page,
      limit
    );

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

// [고객] 내 예약 리뷰 조회 핸들러
export async function getMyReviewByReservationIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    if (!userId) {
      throw new AppError(401, "인증이 필요합니다", "UNAUTHORIZED");
    }

    const { reservationId } = req.params;
    if (!reservationId) {
      throw new AppError(400, "예약 ID는 필수입니다", "INVALID_INPUT");
    }

    const review = await reviewService.getMyReviewByReservationId(
      userId,
      reservationId as string
    );

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
}

// [고객] 리뷰 수정 핸들러
export async function updateReviewHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    if (!userId) {
      throw new AppError(401, "인증이 필요합니다", "UNAUTHORIZED");
    }

    const { reviewId } = req.params;
    if (!reviewId) {
      throw new AppError(400, "리뷰 ID는 필수입니다", "INVALID_INPUT");
    }

    const input = updateReviewSchema.parse(req.body);

    const review = await reviewService.updateReview(
      userId,
      reviewId as string,
      input
    );

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
}

// [고객] 리뷰 삭제 핸들러
export async function deleteReviewHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    if (!userId) {
      throw new AppError(401, "인증이 필요합니다", "UNAUTHORIZED");
    }

    const { reviewId } = req.params;
    if (!reviewId) {
      throw new AppError(400, "리뷰 ID는 필수입니다", "INVALID_INPUT");
    }

    await reviewService.deleteReview(userId, reviewId as string);

    res.status(200).json({ success: true, message: "리뷰가 삭제되었습니다" });
  } catch (error) {
    next(error);
  }
}