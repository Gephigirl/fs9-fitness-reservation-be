import type { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import * as classService from './class.service.js';
import type { AuthRequest } from '../../middlewares/auth.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middlewares/errorHandler.js';

// multer 파일 타입 정의
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

// 업로드된 파일을 URL로 변환
// 첫 번째 이미지가 대표 이미지
function getFileUrls(req: Request) {
  const files = (req as Request & { files?: { [fieldname: string]: MulterFile[] } }).files;
  const baseUrl = `${env.SERVER_URL}/uploads/classes`;
  const imgUrls = files?.images?.map((file) => `${baseUrl}/${file.filename}`) || [];
  const bannerUrl = imgUrls.length > 0 ? imgUrls[0] : undefined;
  
  return { bannerUrl, imgUrls };
}

// 클래스 생성

export async function createClassHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthRequest;
    const { bannerUrl, imgUrls } = getFileUrls(req);
    
    const classData = {
      ...req.body,
      ...(bannerUrl && { bannerUrl }),
      ...(imgUrls.length > 0 && { imgUrls }),
    };
    
    const newClass = await classService.createClass(authReq.user.id, classData);

    res.status(201).json({
      success: true,
      data: newClass,
    });
  } catch (error) {
    next(error);
  }
}

//  클래스 목록 조회

export async function getClassesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthRequest;
    const userRole = authReq.user?.role;
    
    const query = {
      category: req.query.category as string | undefined,
      level: req.query.level as any,
      status: req.query.status as any,
      centerId: req.query.centerId as string | undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10,
    };
    
    const result = await classService.getClasses(query, userRole);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// 클래스 상세 조회
     
export async function getClassByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthRequest;
    const userRole = authReq.user?.role;
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      throw new AppError(400, '클래스 ID가 필요합니다', 'MISSING_CLASS_ID');
    }
    const classData = await classService.getClassById(id, userRole);

    res.status(200).json({
      success: true,
      data: classData,
    });
  } catch (error) {
    next(error);
  }
}

// 클래스 수정
export async function updateClassHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    
    if (!id || typeof id !== 'string') {
      throw new AppError(400, '클래스 ID가 필요합니다', 'MISSING_CLASS_ID');
    }
    
    const { bannerUrl, imgUrls } = getFileUrls(req);
    
    const updateData = {
      ...req.body,
      ...(bannerUrl && { bannerUrl }),
      ...(imgUrls.length > 0 && { imgUrls }),
    };
    
    const updatedClass = await classService.updateClass(authReq.user.id, id, updateData);

    res.status(200).json({
      success: true,
      data: updatedClass,
    });
  } catch (error) {
    next(error);
  }
}

// 클래스 삭제

export async function deleteClassHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    
    if (!id || typeof id !== 'string') {
      throw new AppError(400, '클래스 ID가 필요합니다', 'MISSING_CLASS_ID');
    }
    
    const result = await classService.deleteClass(authReq.user.id, id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}


// 클래스 승인

export async function approveClassHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string') {
      throw new AppError(400, '클래스 ID가 필요합니다', 'MISSING_CLASS_ID');
    }
    
    const updatedClass = await classService.approveClass(id);

    res.status(200).json({
      success: true,
      data: updatedClass,
    });
  } catch (error) {
    next(error);
  }
}

// 클래스 반려

export async function rejectClassHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string') {
      throw new AppError(400, '클래스 ID가 필요합니다', 'MISSING_CLASS_ID');
    }
    
    const updatedClass = await classService.rejectClass(id, req.body);

    res.status(200).json({
      success: true,
      data: updatedClass,
    });
  } catch (error) {
    next(error);
  }
}
 

// 슬롯 생성

export async function createSlotHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthRequest;
    const { id } = req.params; // classId
    
    if (!id || typeof id !== 'string') {
      throw new AppError(400, '클래스 ID가 필요합니다', 'MISSING_CLASS_ID');
    }
    
    const newSlot = await classService.createSlot(authReq.user.id, id, req.body);

    res.status(201).json({
      success: true,
      data: newSlot,
    });
  } catch (error) {
    next(error);
  }
}

// 슬롯 수정

export async function updateSlotHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthRequest;
    const { slotId } = req.params;
    
    if (!slotId || typeof slotId !== 'string') {
      throw new AppError(400, '슬롯 ID가 필요합니다', 'MISSING_SLOT_ID');
    }
    
    const updatedSlot = await classService.updateSlot(authReq.user.id, slotId, req.body);

    res.status(200).json({
      success: true,
      data: updatedSlot,
    });
  } catch (error) {
    next(error);
  }
}

// 슬롯 삭제

export async function deleteSlotHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthRequest;
    const { slotId } = req.params;
    
    if (!slotId || typeof slotId !== 'string') {
      throw new AppError(400, '슬롯 ID가 필요합니다', 'MISSING_SLOT_ID');
    }
    
    const result = await classService.deleteSlot(authReq.user.id, slotId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
