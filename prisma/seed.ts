import {
  PrismaClient,
  UserRole,
  ClassStatus,
  ReservationStatus,
} from "@prisma/client";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 시드 데이터 생성 시작...\n");

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
  const hashedPassword = await bcrypt.hash("test1234", 10);

  // SELLER
  const seller = await prisma.user.upsert({
    where: { email: "seller@test.com" },
    update: {},
    create: {
      id: "test-seller-id-01", // 고정 ID
      email: "seller@test.com",
      password: hashedPassword,
      nickname: "테스트 판매자",
      phone: "010-1111-1111",
      role: UserRole.SELLER,
      pointBalance: 100000,
    },
  });

  console.log("✅ SELLER 사용자 생성:", seller.email);

  // ADMIN
  const admin = await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {},
    create: {
      id: "test-admin-id-01", // 고정 ID
      email: "admin@test.com",
      password: hashedPassword,
      nickname: "테스트 관리자",
      phone: "010-2222-2222",
      role: UserRole.ADMIN,
      pointBalance: 0,
    },
  });

  console.log("✅ ADMIN 사용자 생성:", admin.email);

  // CUSTOMER
  const customer = await prisma.user.upsert({
    where: { email: "customer@test.com" },
    update: {},
    create: {
      id: "test-customer-id-01", // 고정 ID
      email: "customer@test.com",
      password: hashedPassword,
      nickname: "테스트 고객",
      phone: "010-3333-3333",
      role: UserRole.CUSTOMER,
      pointBalance: 50000,
    },
  });

  console.log("✅ CUSTOMER 사용자 생성:", customer.email);

  // SELLER 2, 3 (센터 종류 다양화용)
  const seller2 = await prisma.user.upsert({
    where: { email: "seller2@test.com" },
    update: {},
    create: {
      id: "test-seller-id-02", // 고정 ID
      email: "seller2@test.com",
      password: hashedPassword,
      nickname: "요가 스튜디오 판매자",
      phone: "010-1111-1112",
      role: UserRole.SELLER,
      pointBalance: 0,
    },
  });
  const seller3 = await prisma.user.upsert({
    where: { email: "seller3@test.com" },
    update: {},
    create: {
      id: "test-seller-id-03", // 고정 ID
      email: "seller3@test.com",
      password: hashedPassword,
      nickname: "필라테스 센터 판매자",
      phone: "010-1111-1113",
      role: UserRole.SELLER,
      pointBalance: 0,
    },
  });
  console.log("✅ SELLER 2, 3 생성 (센터 다양화용)");

  // 추가 CUSTOMER 5명 생성
  const customers = [customer];
  for (let i = 1; i <= 5; i++) {
    const newCustomer = await prisma.user.upsert({
      where: { email: `customer${i}@test.com` },
      update: {},
      create: {
        id: `test-customer-id-0${i + 1}`, // 고정 ID
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

  // 포인트 부족 테스트용 고객 (0 포인트)
  const poorCustomer = await prisma.user.upsert({
    where: { email: "poor@test.com" },
    update: {},
    create: {
      id: "test-poor-customer-id-01", // 고정 ID
      email: "poor@test.com",
      password: hashedPassword,
      nickname: "빈털터리 고객",
      phone: "010-0000-0000",
      role: UserRole.CUSTOMER,
      pointBalance: 0,
    },
  });
  console.log("✅ 포인트 부족 테스트용 CUSTOMER 생성: poor@test.com (0 Point)");

  // 4. 리뷰 테스트용 데이터 생성 (customer@test.com)
  // 센터가 없으면 생성 (upsert 사용)
  const reviewTestCenter = await prisma.center.upsert({
    where: { ownerId: seller.id },
    create: {
      id: "review-test-center-01", // 고정 ID 사용
      ownerId: seller.id,
      name: "리뷰 테스트 센터",
      address1: "서울시 강남구 테헤란로 123",
      lat: 37.4979,
      lng: 127.0276,
      introduction: "리뷰 테스트를 위한 센터입니다.",
      businessHours: {
        월요일: "09:00 - 18:00",
        화요일: "09:00 - 18:00",
        수요일: "09:00 - 18:00",
        목요일: "09:00 - 18:00",
        금요일: "09:00 - 18:00",
        토요일: "휴무",
        일요일: "휴무",
      },
    },
    update: {},
  });
  console.log("✅ 리뷰 테스트용 센터 생성:", reviewTestCenter.name);

  const reviewTestClass = await prisma.class.create({
    data: {
      id: "review-test-class-01", // 고정 ID 사용
      centerId: reviewTestCenter.id,
      title: "리뷰 테스트용 요가 클래스",
      category: "요가",
      level: "초급",
      description: "리뷰 작성을 테스트하기 위한 클래스입니다.",
      pricePoints: 10000,
      capacity: 10,
      status: ClassStatus.APPROVED,
      imgUrls: [],
    },
  });
  console.log("✅ 리뷰 테스트용 클래스 생성:", reviewTestClass.title);

  // 3. 리뷰 테스트용 슬롯 및 예약 생성 (과거 날짜, COMPLETED)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(10, 0, 0, 0); // 어제 오전 10시

  const reviewTestSlot = await prisma.classSlot.create({
    data: {
      classId: reviewTestClass.id,
      startAt: yesterday,
      endAt: new Date(yesterday.getTime() + 60 * 60 * 1000), // 1시간 수업
      capacity: 10,
      isOpen: true,
    },
  });
  console.log("✅ 리뷰 테스트용 과거 슬롯 생성:", reviewTestSlot.startAt);

  const reviewTestReservation = await prisma.reservation.create({
    data: {
      id: "review-test-reservation-01", // 고정 ID 사용
      userId: customer.id,
      classId: reviewTestClass.id,
      slotId: reviewTestSlot.id,
      status: ReservationStatus.COMPLETED,
      slotStartAt: reviewTestSlot.startAt,
      pricePoints: reviewTestClass.pricePoints,
      paidPoints: reviewTestClass.pricePoints,
      completedAt: reviewTestSlot.endAt, // 수업 종료 시 완료 처리
    },
  });
  console.log(
    "✅ 리뷰 테스트용 완료된 예약 생성:",
    reviewTestReservation.id,
    reviewTestReservation.status
  );

  // 2. 센터 생성 (종류별: 피트니스 / 요가 스튜디오 / 필라테스)
  const center1 = await prisma.center.upsert({
    where: { ownerId: seller.id },
    update: {},
    create: {
      ownerId: seller.id,
      name: "피트니스 센터 강남점",
      address1: "서울시 강남구 테헤란로 123",
      address2: "3층",
      introduction:
        "최신 시설과 전문 트레이너가 있는 프리미엄 피트니스 센터입니다.",
      businessHours: {
        월요일: "06:00 - 22:00",
        화요일: "06:00 - 22:00",
        수요일: "06:00 - 22:00",
        목요일: "06:00 - 22:00",
        금요일: "06:00 - 22:00",
        토요일: "08:00 - 20:00",
        일요일: "10:00 - 18:00",
      },
      lat: 37.4979,
      lng: 127.0276,
    },
  });
  const center2 = await prisma.center.upsert({
    where: { ownerId: seller2.id },
    update: {},
    create: {
      ownerId: seller2.id,
      name: "힐링 요가 스튜디오",
      address1: "서울시 서초구 서초대로 456",
      address2: "2층",
      introduction: "요가 전용 스튜디오. 힐링·명상·아사나 등 다양한 수업.",
      businessHours: {
        월요일: "07:00 - 21:00",
        화요일: "07:00 - 21:00",
        수요일: "07:00 - 21:00",
        목요일: "07:00 - 21:00",
        금요일: "07:00 - 21:00",
        토요일: "09:00 - 18:00",
        일요일: "휴무",
      },
      lat: 37.4833,
      lng: 127.0323,
    },
  });
  const center3 = await prisma.center.upsert({
    where: { ownerId: seller3.id },
    update: {},
    create: {
      ownerId: seller3.id,
      name: "코어 필라테스",
      address1: "서울시 송파구 올림픽로 789",
      address2: "1층",
      introduction:
        "매트·리포머 전문. 재활과 코어 강화에 특화된 필라테스 센터.",
      businessHours: {
        월요일: "08:00 - 22:00",
        화요일: "08:00 - 22:00",
        수요일: "08:00 - 22:00",
        목요일: "08:00 - 22:00",
        금요일: "08:00 - 22:00",
        토요일: "10:00 - 16:00",
        일요일: "10:00 - 16:00",
      },
      lat: 37.5145,
      lng: 127.106,
    },
  });
  const centers = [center1, center2, center3];
  console.log("✅ 센터 3종 생성:", centers.map((c) => c.name).join(", "));

  // 3. 클래스 및 슬롯, 예약 생성 (센터별·종류 다양: 카테고리/레벨/상태)
  const classData: Array<{
    centerIndex: number;
    title: string;
    category: string;
    level: string;
    desc: string;
    notice?: string;
    price: number;
    capacity: number;
    times: number[];
    status: ClassStatus;
    rejectReason?: string;
    schedule?: Record<string, string>;
    slotDaysCount: number; // 슬롯 생성할 일수 (갯수 제한용)
  }> = [
    {
      centerIndex: 0,
      title: "아침 요가",
      category: "요가",
      level: "초급",
      desc: "상쾌한 아침을 여는 요가",
      notice: "요가 매트 지참 또는 대여 가능.",
      price: 15000,
      capacity: 99,
      times: [7, 8, 9],
      status: ClassStatus.PENDING,
      slotDaysCount: 22,
    },
    {
      centerIndex: 0,
      title: "1:1 PT",
      category: "헬스",
      level: "고급",
      desc: "전문가와 함께하는 맞춤형 트레이닝",
      price: 50000,
      capacity: 99,
      times: [13, 14, 15],
      status: ClassStatus.PENDING,
      slotDaysCount: 22,
    },
    {
      centerIndex: 0,
      title: "저녁 필라테스",
      category: "필라테스",
      level: "중급",
      desc: "퇴근 후 힐링 필라테스",
      price: 20000,
      capacity: 99,
      times: [19, 20, 21],
      status: ClassStatus.PENDING,
      slotDaysCount: 22,
    },
    {
      centerIndex: 1,
      title: "힐링 요가",
      category: "요가",
      level: "입문",
      desc: "스트레칭과 호흡 중심의 힐링 요가",
      notice: "편한 복장으로 참여해 주세요.",
      price: 12000,
      capacity: 99,
      times: [10, 19],
      status: ClassStatus.APPROVED,
      schedule: { 월수금: "10:00, 19:00", 화목: "19:00" },
      slotDaysCount: 7,
    },
    {
      centerIndex: 1,
      title: "아사나 요가",
      category: "요가",
      level: "중급",
      desc: "자세 정렬과 근력·유연성 강화",
      price: 18000,
      capacity: 99,
      times: [9, 18],
      status: ClassStatus.APPROVED,
      slotDaysCount: 7,
    },
    {
      centerIndex: 1,
      title: "명상 요가",
      category: "요가",
      level: "입문",
      desc: "명상과 가벼운 동작으로 마음 챙기기",
      price: 10000,
      capacity: 99,
      times: [20],
      status: ClassStatus.APPROVED,
      slotDaysCount: 0,
    },
    {
      centerIndex: 2,
      title: "매트 필라테스",
      category: "필라테스",
      level: "초급",
      desc: "매트 위에서 하는 기초 필라테스",
      notice: "수건 지참 권장.",
      price: 15000,
      capacity: 99,
      times: [11, 14, 20],
      status: ClassStatus.APPROVED,
      slotDaysCount: 7,
    },
    {
      centerIndex: 2,
      title: "리포머 필라테스",
      category: "필라테스",
      level: "중급",
      desc: "리포머 기구를 활용한 필라테스",
      price: 25000,
      capacity: 99,
      times: [10, 15],
      status: ClassStatus.REJECTED,
      rejectReason: "기구 안전 점검 후 재신청 부탁드립니다.",
      slotDaysCount: 0,
    },
  ];

  const now = new Date();

  // 날짜 유틸 함수
  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  // userId + slotStartAt 전역 추적 (모든 클래스·슬롯에 걸쳐 동일 시간대 중복 예약 방지)
  const usedUserSlot = new Set<string>();

  for (const cData of classData) {
    const centerId = centers[cData.centerIndex].id;
    const cls = await prisma.class.create({
      data: {
        centerId,
        title: cData.title,
        category: cData.category,
        level: cData.level,
        description: cData.desc,
        notice: cData.notice ?? undefined,
        pricePoints: cData.price,
        capacity: cData.capacity,
        status: cData.status,
        rejectReason: cData.rejectReason ?? undefined,
        schedule: cData.schedule ?? undefined,
        imgUrls: [],
      },
    });
    console.log(
      `✅ 클래스 생성: ${cls.title} [${cData.category}/${cData.level}] (${cData.status})`
    );

    // APPROVED 클래스만 슬롯 생성, slotDaysCount만큼만 (갯수 제한)
    if (cData.status !== ClassStatus.APPROVED || cData.slotDaysCount <= 0)
      continue;

    const dayFrom = cData.slotDaysCount >= 22 ? -7 : 0;
    const dayTo = cData.slotDaysCount >= 22 ? 14 : cData.slotDaysCount - 1;

    for (let d = dayFrom; d <= dayTo; d++) {
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
            capacity: cData.capacity,
            isOpen: true,
          },
        });

        const slotKey = startAt.getTime();
        const availableCustomers = customers.filter(
          (c) => !usedUserSlot.has(`${c.id}|${slotKey}`)
        );
        const reservationCount = Math.min(
          Math.floor(Math.random() * 4),
          availableCustomers.length
        );
        const shuffledCustomers = [...availableCustomers].sort(
          () => 0.5 - Math.random()
        );
        const selectedCustomers = shuffledCustomers.slice(0, reservationCount);

        for (const cust of selectedCustomers) {
          usedUserSlot.add(`${cust.id}|${slotKey}`);
          let status: ReservationStatus = ReservationStatus.BOOKED;
          const isPast = startAt < now;

          if (isPast) {
            status =
              Math.random() > 0.2
                ? ReservationStatus.COMPLETED
                : ReservationStatus.CANCELED;
          } else {
            status =
              Math.random() > 0.1
                ? ReservationStatus.BOOKED
                : ReservationStatus.CANCELED;
          }

          const completedAt =
            status === ReservationStatus.COMPLETED ? endAt : null;
          const canceledAt =
            status === ReservationStatus.CANCELED ? new Date() : null;

          await prisma.reservation.create({
            data: {
              userId: cust.id,
              classId: cls.id,
              slotId: slot.id,
              status,
              slotStartAt: startAt,
              pricePoints: cls.pricePoints,
              paidPoints: cls.pricePoints,
              completedAt,
              canceledAt,
            },
          });
        }
      }
    }
  }

  // ====== 권한 테스트용: seller2가 작성한 리뷰 데이터 추가 ======
  console.log("\n🔐 권한 테스트용 리뷰 데이터 생성 시작...");
  
  // seller2의 완료된 예약 생성 (과거 날짜)
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  twoDaysAgo.setHours(14, 0, 0, 0); // 2일 전 오후 2시

  const seller2TestSlot = await prisma.classSlot.create({
    data: {
      classId: reviewTestClass.id,
      startAt: twoDaysAgo,
      endAt: new Date(twoDaysAgo.getTime() + 60 * 60 * 1000), // 1시간 수업
      capacity: 10,
      isOpen: true,
    },
  });

  const seller2TestReservation = await prisma.reservation.create({
    data: {
      id: "review-test-reservation-seller2-01",
      userId: seller2.id, // seller2가 예약
      classId: reviewTestClass.id,
      slotId: seller2TestSlot.id,
      status: ReservationStatus.COMPLETED,
      slotStartAt: seller2TestSlot.startAt,
      pricePoints: reviewTestClass.pricePoints,
      paidPoints: reviewTestClass.pricePoints,
      completedAt: seller2TestSlot.endAt,
    },
  });

  console.log(
    "✅ seller2용 완료된 예약 생성:",
    seller2TestReservation.id
  );

  // seller2가 작성한 리뷰 생성
  const seller2Review = await prisma.review.create({
    data: {
      id: "review-test-review-seller2-01",
      reservationId: seller2TestReservation.id,
      userId: seller2.id,
      classId: reviewTestClass.id,
      rating: 5,
      content: "seller2가 작성한 리뷰입니다. 권한 테스트용.",
      imgUrls: [],
    },
  });

  console.log(
    "✅ seller2 리뷰 생성:",
    seller2Review.id,
    `(rating: ${seller2Review.rating})`
  );
  console.log("   → 권한 테스트: customer가 이 리뷰를 수정/삭제하면 403 에러 발생해야 함");


  // JWT 토큰 생성 - 항상 동일한 토큰을 생성하기 위해 고정값 사용
  // .env의 JWT_SECRET을 사용하되, 없으면 기본값 사용
  const JWT_SECRET = process.env.JWT_SECRET || "JWT_SECRET_KEY"; 
  const FIXED_IAT = 1735689600; // 2025-01-01 00:00:00 UTC (고정된 발급 시간)
  const EXPIRES_IN = 60 * 60 * 24 * 365 * 10; // 10년 (사실상 무제한)

  // 커스텀 sign 함수
  const createFixedToken = (payload: object) => {
    return jwt.sign(
      {
        ...payload,
        iat: FIXED_IAT, // iat 강제 설정 (중요: 이렇게 하면 항상 같은 토큰 생성됨)
      },
      JWT_SECRET,
      { expiresIn: EXPIRES_IN } // expiresIn은 iat 기준으로 계산됨
    );
  };

  const sellerToken = createFixedToken({
    id: seller.id,
    email: seller.email,
    role: seller.role,
  });

  const seller2Token = createFixedToken({
    id: seller2.id,
    email: seller2.email,
    role: seller2.role,
  });

  const adminToken = createFixedToken({
    id: admin.id,
    email: admin.email,
    role: admin.role,
  });

  const customerToken = createFixedToken({
    id: customer.id,
    email: customer.email,
    role: customer.role,
  });

  const poorCustomerToken = createFixedToken({
    id: poorCustomer.id,
    email: poorCustomer.email,
    role: poorCustomer.role,
  });

  console.log("\n✨ 시드 데이터 생성 완료!");
  console.log("\n📝 테스트 계정:");
  console.log("   판매자(SELLER): seller@test.com / test1234 (강남 피트니스)");
  console.log("   판매자(SELLER): seller2@test.com / test1234 (요가 스튜디오)");
  console.log("   판매자(SELLER): seller3@test.com / test1234 (필라테스)");
  console.log("   관리자(ADMIN):  admin@test.com / test1234");
  console.log("   고객(CUSTOMER): customer@test.com / test1234");
  console.log("   빈털터리(CUSTOMER): poor@test.com / test1234 (0 Point)");
  console.log("   (추가) 고객 1~5: customer[N]@test.com / test1234");

  console.log("\n🔑 테스트용 고정 JWT 토큰 (항상 동일함)");
  console.log("\n판매자 토큰(SELLER_TOKEN):");
  console.log(sellerToken);
  console.log("\n판매자2 토큰(SELLER2_TOKEN):");
  console.log(seller2Token);
  console.log("\n관리자 토큰(ADMIN_TOKEN):");
  console.log(adminToken);
  console.log("\n고객 토큰(CUSTOMER_TOKEN):");
  console.log(customerToken);
  console.log("\n빈털터리 고객 토큰(POOR_CUSTOMER_TOKEN):");
  console.log(poorCustomerToken);
}

main()
  .catch((e) => {
    console.error("❌ 시드 데이터 생성 실패:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
