import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../../middlewares/auth.ts";
import * as centerService from "./center.service.ts";

// 내 센터 조회 (SELLER 전용)
// GET /centers/me
export async function getMyCenterHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthRequest;
    const center = await centerService.getMyCenter(authReq.user.id);
    res.status(200).json({ success: true, data: center });
  } catch (error) {
    next(error);
  }
}

// 센터 목록 조회 핸들러
// GET /centers
export async function getCentersHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await centerService.getCenters(req.query as any);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

// 센터 상세 조회 핸들러
// GET /centers/:id
export async function getCenterByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const centerData = await centerService.getCenterById(id as string);

    res.status(200).json({ success: true, data: centerData });
  } catch (error) {
    next(error);
  }
}

// 센터 수정 핸들러
// PATCH /centers/:id
export async function updateCenterHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      res
        .status(401)
        .json({ success: false, error: { message: "인증이 필요합니다" } });
      return;
    }

    const { id } = req.params;

    const updatedCenter = await centerService.updateCenter(
      authReq.user.id,
      id as string,
      req.body,
    );

    res.status(200).json({ success: true, data: updatedCenter });
  } catch (error) {
    next(error);
  }
}
