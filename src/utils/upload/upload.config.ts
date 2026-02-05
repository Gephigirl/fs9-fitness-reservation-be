import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import type { Request } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 업로드 디렉토리 설정
const UPLOAD_DIR = path.join(__dirname, '../../../uploads');

// 업로드 디렉토리 생성
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 이미지 타입별 하위 디렉토리
export const UPLOAD_PATHS = {
  CLASS: path.join(UPLOAD_DIR, 'classes'),
  // CENTER: path.join(UPLOAD_DIR, 'centers'), (center schema 추가 시)
  PROFILE: path.join(UPLOAD_DIR, 'profiles'),
  REVIEW: path.join(UPLOAD_DIR, 'reviews'),
} as const;

// 디렉토리 생성
Object.values(UPLOAD_PATHS).forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});


const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const createStorage = (uploadPath: string) => {
  return multer.diskStorage({
    destination: (req: Request, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req: Request, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname).toLowerCase();
      const basename = path.basename(file.originalname, ext);
      const safeBasename = basename.replace(/[^a-zA-Z0-9가-힣]/g, '_').substring(0, 50);
      cb(null, `${safeBasename}-${uniqueSuffix}${ext}`);
    },
  });
};

// 파일 필터
export const imageFileFilter = (
  req: Request,
  file: any,
  cb: any
): void => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      new Error(`허용되지 않는 파일 형식입니다. 허용 형식: ${ALLOWED_EXTENSIONS.join(', ')}`)
    );
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return cb(new Error('허용되지 않는 MIME 타입입니다'));
  }

  cb(null, true);
};

// 파일 삭제
export const deleteFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('파일 삭제 실패:', error);
  }
};

// URL에서 파일 경로 추출
export const getFilePathFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const filepath = path.join(__dirname, '../../..', urlObj.pathname);
    return filepath;
  } catch {
    return null;
  }
};
