import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

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

// 라우터는 여기에 추가
// app.use('/api/auth', authRouter);
// app.use('/api/users', userRouter);
// ...

export default app;
