import type { Request, Response, NextFunction } from "express";
import * as userService from "./user.service.ts";
import { AppError } from "../../middlewares/errorHandler.ts";
import type { AuthRequest } from "../../middlewares/auth.ts";

// GET /users - 회원 목록 조회 (관리자)
export async function getUsersHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const role = req.query.role as string | undefined;
    const searchType = req.query.searchType as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await userService.getUsers({
      page,
      limit,
      role,
      searchType,
      search,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// GET /users/stats - 회원 통계 조회 (관리자)
export async function getUserStatsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const stats = await userService.getUserStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

// GET /users/:id - 회원 상세 조회 (관리자)
export async function getUserByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      throw new AppError(400, "회원 ID가 필요합니다", "MISSING_USER_ID");
    }

    const user = await userService.getUserById(id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

// multer 파일 타입
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

// PATCH /users/me - 내 프로필 수정
export async function updateProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      throw new AppError(401, "인증이 필요합니다", "AUTHENTICATION_REQUIRED");
    }

    // 프로필 이미지 처리
    let profileImgUrl: string | undefined;
    const filesReq = req as Request & { file?: MulterFile };
    if (filesReq.file) {
      const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3000}`;
      profileImgUrl = `${serverUrl}/uploads/profiles/${filesReq.file.filename}`;
    }

    const updatedUser = await userService.updateProfile(
      authReq.user.id,
      req.body,
      profileImgUrl,
    );

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    next(error);
  }
}
