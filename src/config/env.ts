import dotenv from 'dotenv';

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || '3000',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  
  // 업로드 설정
  UPLOAD_TYPE: (process.env.UPLOAD_TYPE || 'LOCAL') as 'LOCAL' | 'S3',
  AWS_REGION: process.env.AWS_REGION || '',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME || '',

  SERVER_URL: process.env.SERVER_URL || `http://localhost:${process.env.PORT || '3000'}`,
};
