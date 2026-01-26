import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import classRouter from './modules/class/class.routes.js';

const app = express();

// 미들웨어
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 헬스체크
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 라우터
app.use('/api/classes', classRouter);


export default app;
