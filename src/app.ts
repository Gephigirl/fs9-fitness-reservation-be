import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import classRouter from './modules/class/class.routes.js';
import { logger } from './middlewares/logger.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 미들웨어
app.use(logger);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, 
}));
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 헬스체크
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 라우터
app.use('/api/classes', classRouter);


// 에러핸들러
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
