import app from './app.js';
import { env } from './config/env.js';
import prisma from './config/prisma.js';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log(`✅ 서버가 http://localhost:${PORT} 에서 실행중입니다.`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM 신호를 받았습니다. 서버를 종료합니다...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT 신호를 받았습니다. 서버를 종료합니다...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});
