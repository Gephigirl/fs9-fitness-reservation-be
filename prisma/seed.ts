import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 시드 데이터 생성 시작...\n');

  // 기존 데이터 삭제 
  await prisma.reservation.deleteMany();
  await prisma.classSlot.deleteMany();
  await prisma.class.deleteMany();
  await prisma.center.deleteMany();
  await prisma.user.deleteMany();

  // 1. 테스트 사용자 생성
  const hashedPassword = await bcrypt.hash('test1234', 10);

  // SELLER
  const seller = await prisma.user.upsert({
    where: { email: 'seller@test.com' },
    update: {},
    create: {
      email: 'seller@test.com',
      password: hashedPassword,
      nickname: '테스트 판매자',
      phone: '010-1111-1111',
      role: UserRole.SELLER,
      pointBalance: 100000,
    },
  });

  console.log('✅ SELLER 사용자 생성:', seller.email);

  // ADMIN 
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      password: hashedPassword,
      nickname: '테스트 관리자',
      phone: '010-2222-2222',
      role: UserRole.ADMIN,
      pointBalance: 0,
    },
  });

  console.log('✅ ADMIN 사용자 생성:', admin.email);

  // CUSTOMER 
  const customer = await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: {
      email: 'customer@test.com',
      password: hashedPassword,
      nickname: '테스트 고객',
      phone: '010-3333-3333',
      role: UserRole.CUSTOMER,
      pointBalance: 50000,
    },
  });

  console.log('✅ CUSTOMER 사용자 생성:', customer.email);

  // 2. 센터 생성 (SELLER 소유)
  const center = await prisma.center.upsert({
    where: { ownerId: seller.id },
    update: {},
    create: {
      ownerId: seller.id,
      name: '피트니스 센터 강남점',
      address1: '서울시 강남구 테헤란로 123',
      address2: '3층',
      introduction: '최신 시설과 전문 트레이너가 있는 프리미엄 피트니스 센터입니다.',
      businessHours: {
        월요일: '06:00 - 22:00',
        화요일: '06:00 - 22:00',
        수요일: '06:00 - 22:00',
        목요일: '06:00 - 22:00',
        금요일: '06:00 - 22:00',
        토요일: '08:00 - 20:00',
        일요일: '10:00 - 18:00',
      },
      lat: 37.4979,
      lng: 127.0276,
    },
  });

  console.log('✅ 센터 생성:', center.name);



  // JWT 토큰 생성
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

  const signOptions: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };

  const sellerToken = jwt.sign(
    { id: seller.id, email: seller.email, role: seller.role },
    JWT_SECRET,
    signOptions
  );

  const adminToken = jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role },
    JWT_SECRET,
    signOptions
  );

  const customerToken = jwt.sign(
    { id: customer.id, email: customer.email, role: customer.role },
    JWT_SECRET,
    signOptions
  );

  console.log('\n✨ 시드 데이터 생성 완료!');
  console.log('\n📝 테스트 계정:');
  console.log('   SELLER: seller@test.com / test1234');
  console.log('   ADMIN:  admin@test.com / test1234');
  console.log('   CUSTOMER: customer@test.com / test1234');
  
  console.log('\n🔑 테스트용 JWT 토큰 ');
  console.log('\nSELLER_TOKEN:');
  console.log(sellerToken);
  console.log('\nADMIN_TOKEN:');
  console.log(adminToken);
  console.log('\nCUSTOMER_TOKEN:');
  console.log(customerToken);
}

main()
  .catch((e) => {
    console.error('❌ 시드 데이터 생성 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
