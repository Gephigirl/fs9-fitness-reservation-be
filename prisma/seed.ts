import { PrismaClient, UserRole, ClassStatus, ReservationStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 시드 데이터 생성 시작...\n');

  // 기존 데이터 삭제 (순서 중요: 자식 테이블부터 삭제)
  await prisma.pointHistory.deleteMany();
  await prisma.review.deleteMany();
  await prisma.reservation.deleteMany(); // Reservation이 UserCoupon을 참조하므로 먼저 삭제
  await prisma.userCoupon.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.classSlot.deleteMany();
  await prisma.class.deleteMany();
  await prisma.couponTemplate.deleteMany();
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

  // 추가 CUSTOMER 5명 생성
  const customers = [customer];
  for (let i = 1; i <= 5; i++) {
    const newCustomer = await prisma.user.upsert({
      where: { email: `customer${i}@test.com` },
      update: {},
      create: {
        email: `customer${i}@test.com`,
        password: hashedPassword,
        nickname: `고객 ${i}`,
        phone: `010-4444-444${i}`,
        role: UserRole.CUSTOMER,
        pointBalance: Math.floor(Math.random() * 100000),
      },
    });
    customers.push(newCustomer);
    console.log(`✅ 추가 CUSTOMER 생성: customer${i}@test.com`);
  }


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

  // 3. 클래스 및 슬롯, 예약 생성
  const classData = [
    { 
      title: '아침 요가', 
      category: '요가', 
      level: '초급', 
      desc: '상쾌한 아침을 여는 요가', 
      price: 15000,
      times: [7, 8, 9] // 아침 시간대
    },
    { 
      title: '1:1 PT', 
      category: '헬스', 
      level: '고급', 
      desc: '전문가와 함께하는 맞춤형 트레이닝', 
      price: 50000,
      times: [13, 14, 15] // 오후 시간대
    },
    { 
      title: '저녁 필라테스', 
      category: '필라테스', 
      level: '중급', 
      desc: '퇴근 후 힐링 필라테스', 
      price: 20000,
      times: [19, 20, 21] // 저녁 시간대
    },
  ];

  const now = new Date();
  
  // 날짜 유틸 함수
  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  for (const cData of classData) {
    const cls = await prisma.class.create({
      data: {
        centerId: center.id,
        title: cData.title,
        category: cData.category,
        level: cData.level,
        description: cData.desc,
        pricePoints: cData.price,
        capacity: 10,
        status: ClassStatus.APPROVED,
        imgUrls: [],
      },
    });
    console.log(`✅ 클래스 생성: ${cls.title}`);

    // 슬롯 생성 (지난 7일 ~ 향후 14일)
    for (let d = -7; d <= 14; d++) {
      const targetDate = addDays(now, d);
      
      for (const hour of cData.times) {
        const startAt = new Date(targetDate);
        startAt.setHours(hour, 0, 0, 0);
        const endAt = new Date(startAt);
        endAt.setHours(hour + 1, 0, 0, 0);

        const slot = await prisma.classSlot.create({
          data: {
            classId: cls.id,
            startAt,
            endAt,
            capacity: 10,
            isOpen: true,
          },
        });

        // 예약 생성 로직
        // 과거 슬롯 -> COMPLETED (완료됨) 확률 높음
        // 미래 슬롯 -> BOOKED (예약됨) 확률 높음
        // 일부 CANCELED (취소됨)

        // 각 슬롯당 0~3명 랜덤 예약
        const reservationCount = Math.floor(Math.random() * 4);
        
        // 셔플하여 랜덤 고객 선택
        const shuffledCustomers = [...customers].sort(() => 0.5 - Math.random());
        const selectedCustomers = shuffledCustomers.slice(0, reservationCount);

        for (const cust of selectedCustomers) {
          let status: ReservationStatus = ReservationStatus.BOOKED;
          const isPast = startAt < now;

          if (isPast) {
            status = Math.random() > 0.2 ? ReservationStatus.COMPLETED : ReservationStatus.CANCELED;
          } else {
            status = Math.random() > 0.1 ? ReservationStatus.BOOKED : ReservationStatus.CANCELED;
          }

          // 완료된 예약이면 completedAt 설정
          const completedAt = status === ReservationStatus.COMPLETED ? endAt : null;
          // 취소된 예약이면 canceledAt 설정
          const canceledAt = status === ReservationStatus.CANCELED ? new Date() : null;

          await prisma.reservation.create({
            data: {
              userId: cust.id,
              classId: cls.id,
              slotId: slot.id,
              status,
              slotStartAt: startAt,
              pricePoints: cls.pricePoints,
              paidPoints: cls.pricePoints, // 쿠폰 없이 전액 지불 가정
              completedAt,
              canceledAt,
            },
          });
        }
      }
    }
  }


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
  console.log('   (추가) CUSTOMER 1~5: customer[N]@test.com / test1234');
  
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
