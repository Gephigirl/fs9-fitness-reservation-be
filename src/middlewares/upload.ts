import multer from 'multer';
import type { Request, Response, NextFunction } from 'express';
import {
  createStorage,
  imageFileFilter,
  MAX_FILE_SIZE,
  UPLOAD_PATHS,
} from '../utils/upload/upload.config.js';

// 클래스 이미지 업로드 설정
const classUpload = multer({
  storage: createStorage(UPLOAD_PATHS.CLASS),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 3, 
  },
});

// 클래스 이미지 업로드 미들웨어
export const uploadClassImages = classUpload.fields([
  { name: 'images', maxCount: 3 },
]);

// multer 에러 핸들링 미들웨어
export const handleUploadError = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          message: `파일 크기가 너무 큽니다. 최대 ${MAX_FILE_SIZE / 1024 / 1024}MB까지 업로드 가능합니다`,
        },
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: {
          message: '업로드 가능한 파일 개수를 초과했습니다',
        },
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: {
          message: '예상치 못한 필드 이름입니다',
        },
      });
    }
  }

  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: error.message || '파일 업로드 중 오류가 발생했습니다',
      },
    });
  }

  next();
};
