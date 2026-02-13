import type { Request, Response, NextFunction } from "express";
import * as reviewService from "./review.service.js";
import type { AuthRequest } from "../../middlewares/auth.ts";
import { AppError } from "../../middlewares/errorHandler.ts";

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

    const { reservationId, rating, content, imgUrls } = req.body;

    const review = await reviewService.createReview(userId, {
      reservationId,
      rating: Number(rating),
      content,
      ...(imgUrls ? { imgUrls: imgUrls as string[] } : {}),
    });

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
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

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

    const { rating, content, imgUrls } = req.body;

    const review = await reviewService.updateReview(
      userId,
      reviewId as string,
      {
        ...(rating !== undefined && { rating: Number(rating) }),
        ...(content !== undefined && { content }),
        ...(imgUrls !== undefined && { imgUrls: imgUrls as string[] }),
      }
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