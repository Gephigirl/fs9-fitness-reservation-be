import type { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import * as classService from './class.service.js';
import type { AuthRequest } from '../../middlewares/auth.js';

// 클래스 생성

export async function createClassHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthRequest;
    const newClass = await classService.createClass(authReq.user.id, req.body);

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
    const result = await classService.getClasses(req.query as any);

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
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: { message: '클래스 ID가 필요합니다' },
      });
    }
    const classData = await classService.getClassById(id);

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
      return res.status(400).json({
        success: false,
        error: { message: '클래스 ID가 필요합니다' },
      });
    }
    
    const updatedClass = await classService.updateClass(authReq.user.id, id, req.body);

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
      return res.status(400).json({
        success: false,
        error: { message: '클래스 ID가 필요합니다' },
      });
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
      return res.status(400).json({
        success: false,
        error: { message: '클래스 ID가 필요합니다' },
      });
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
      return res.status(400).json({
        success: false,
        error: { message: '클래스 ID가 필요합니다' },
      });
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
      return res.status(400).json({
        success: false,
        error: { message: '클래스 ID가 필요합니다' },
      });
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
      return res.status(400).json({
        success: false,
        error: { message: '슬롯 ID가 필요합니다' },
      });
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
      return res.status(400).json({
        success: false,
        error: { message: '슬롯 ID가 필요합니다' },
      });
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
