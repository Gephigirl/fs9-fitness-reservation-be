import prisma from "../../config/prisma.js";
import { ReservationStatus, PointUsed, UserRole } from "@prisma/client";
import type {
  CreateReservationInput,
  CancelReservationInput,
  QueryReservationInput,
  QuerySellerSlotsInput,
  QueryReservationStatsInput,
} from "./reservation.validation.js";
import type { PaginationResponse } from "../../types/common.types.js";
import { AppError } from "../../middlewares/errorHandler.js";
import * as reservationRepository from "./reservation.repository.js";

// [고객] 결제 및 예약하기
export async function createReservation(
  userId: string,
  data: CreateReservationInput,
  now: Date = new Date()
) {
  const slot = await reservationRepository.findSlotWithClass(data.slotId);
  if (!slot) {
    throw new AppError(404, "슬롯을 찾을 수 없습니다", "SLOT_NOT_FOUND");
  }
  if (!slot.isOpen) {
    throw new AppError(400, "예약이 마감된 슬롯입니다", "SLOT_CLOSED");
  }
  if (slot.startAt < now) {
    throw new AppError(400, "지난 슬롯은 예약할 수 없습니다", "PAST_SLOT");
  }
  if (slot._count.reservations >= slot.capacity) {
    throw new AppError(400, "정원이 마감되었습니다", "SLOT_FULL");
  }
  if (slot.class.status !== "APPROVED") {
    throw new AppError(
      400,
      "승인된 클래스만 예약 가능합니다",
      "CLASS_NOT_APPROVED"
    );
  }
  const user = await reservationRepository.findUserWithPoint(userId);
  if (!user) {
    throw new AppError(404, "유저를 찾을 수 없습니다", "USER_NOT_FOUND");
  }
  let couponDiscount = 0;
  let userCoupon = null;

  if (data.userCouponId) {
    userCoupon = await reservationRepository.findUserCouponById(
      data.userCouponId
    );

    if (!userCoupon) {
      throw new AppError(404, "쿠폰을 찾을 수 없습니다", "COUPON_NOT_FOUND");
    }

    if (userCoupon.usedAt) {
      throw new AppError(400, "이미 사용된 쿠폰입니다", "COUPON_USED");
    }

    if (userCoupon.template.expiresAt && userCoupon.template.expiresAt < now) {
      throw new AppError(400, "만료된 쿠폰입니다", "COUPON_EXPIRED");
    }

    // 할인 계산
    if (userCoupon.template.discountPoints) {
      couponDiscount = userCoupon.template.discountPoints;
    } else if (userCoupon.template.discountPercentage) {
      couponDiscount = Math.floor(
        (slot.class.pricePoints * userCoupon.template.discountPercentage) / 100
      );
    }
  }

  const pricePoints = slot.class.pricePoints;
  const paidPoints = Math.max(0, pricePoints - couponDiscount);

  if (user.pointBalance < paidPoints) {
    throw new AppError(400, "포인트가 부족합니다", "INSUFFICIENT_POINTS");
  }

  const reservation = await prisma.$transaction(async (tx) => {
    const newReservation = await tx.reservation.create({
      data: {
        userId,
        classId: slot.class.id,
        slotId: data.slotId,
        status: ReservationStatus.BOOKED,
        slotStartAt: slot.startAt,
        pricePoints,
        couponDiscountPoints: couponDiscount,
        paidPoints,
        userCouponId: data.userCouponId || null,
      },
      include: {
        class: true,
        slot: true,
        userCoupon: {
          include: {
            template: true,
          },
        },
      },
    });

    // 유저 포인트 차감
    await tx.user.update({
      where: { id: userId },
      data: {
        pointBalance: {
          decrement: paidPoints,
        },
      },
    });

    await tx.pointHistory.create({
      data: {
        userId,
        type: PointUsed.USE,
        amount: paidPoints,
        balanceBefore: user.pointBalance,
        balanceAfter: user.pointBalance - paidPoints,
        reservationId: newReservation.id,
      },
    });

    if (data.userCouponId) {
      await tx.userCoupon.update({
        where: { id: data.userCouponId },
        data: { usedAt: now },
      });
    }

    return newReservation;
  });

  return reservation;
}

// [공통] 예약 목록 조회
export async function getReservations(
  query: QueryReservationInput
): Promise<PaginationResponse<any>> {
  const {
    userId,
    classId,
    slotId,
    status,
    startDate,
    endDate,
    page = 1,
    limit = 10,
    keyword,
    searchType,
  } = query;

  // 1. 필터 조건 구성
  const where: any = {};
  if (userId) where.userId = userId;
  if (classId) where.classId = classId;
  if (slotId) where.slotId = slotId;
  if (status) where.status = status;

  // 검색 조건
  if (keyword) {
    if (searchType === "User") {
      where.user = {
        OR: [
          { nickname: { contains: keyword, mode: "insensitive" } },
          { email: { contains: keyword, mode: "insensitive" } },
        ],
      };
    } else if (searchType === "Class") {
      where.class = {
        title: { contains: keyword, mode: "insensitive" },
      };
    } else if (searchType === "Center") {
      where.class = {
        center: {
          name: { contains: keyword, mode: "insensitive" },
        },
      };
    }
  }

  // 2. 날짜 필터
  if (startDate || endDate) {
    where.slot = where.slot || {};
    where.slot.startAt = {};
    if (startDate) where.slot.startAt.gte = new Date(startDate);
    if (endDate) where.slot.startAt.lte = new Date(endDate);
  }

  // 3. 페이지네이션 계산
  const skip = (page - 1) * limit;

  // 4. Promise.all로 예약 목록과 총 개수 조회
  const [items, total] = await Promise.all([
    reservationRepository.findManyReservations({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    reservationRepository.countReservations(where),
  ]);

  // 7. PaginationResponse 반환
  return {
    data: items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// [공통] 예약 상세 조회
export async function getReservationById(reservationId: string) {
  const reservation =
    await reservationRepository.findReservationById(reservationId);

  if (!reservation) {
    throw new AppError(404, "예약을 찾을 수 없습니다", "RESERVATION_NOT_FOUND");
  }

  return reservation;
}

// [고객/관리자] 예약 취소 및 환불
export async function cancelReservation(
  userId: string,
  reservationId: string,
  data: CancelReservationInput,
  canceledBy: UserRole,
  now: Date = new Date()
) {
  // 1. 예약 조회
  const reservation =
    await reservationRepository.findReservationSimple(reservationId);

  // 2. 예약이 없으면 에러
  if (!reservation) {
    throw new AppError(404, "예약을 찾을 수 없습니다", "RESERVATION_NOT_FOUND");
  }

  // 3. 이미 취소됨
  if (reservation.status === ReservationStatus.CANCELED) {
    throw new AppError(400, "이미 취소된 예약입니다", "ALREADY_CANCELED");
  }

  // 4. 이미 완료됨
  if (reservation.status === ReservationStatus.COMPLETED) {
    throw new AppError(
      400,
      "완료된 예약은 취소할 수 없습니다",
      "ALREADY_COMPLETED"
    );
  }

  // 5. CUSTOMER인 경우 본인 예약 확인
  if (canceledBy === UserRole.CUSTOMER && reservation.userId !== userId) {
    throw new AppError(403, "본인의 예약만 취소할 수 있습니다", "FORBIDDEN");
  }

  // 6. 슬롯 시작 시간이 지났으면 에러
  if (reservation.slot.startAt < now) {
    throw new AppError(
      400,
      "이미 시작된 예약은 취소할 수 없습니다",
      "PAST_RESERVATION"
    );
  }

  // 7. Transaction으로 취소 및 환불 처리
  const updatedReservation = await prisma.$transaction(async (tx) => {
    // 예약 상태 변경
    const updated = await tx.reservation.update({
      where: { id: reservationId },
      data: {
        status: ReservationStatus.CANCELED,
        canceledAt: now,
        canceledBy,
        cancelNote: data.cancelNote || null,
      },
    });

    // 포인트 환불
    await tx.user.update({
      where: { id: reservation.userId },
      data: {
        pointBalance: {
          increment: reservation.paidPoints,
        },
      },
    });

    // 포인트 내역 생성
    await tx.pointHistory.create({
      data: {
        userId: reservation.userId,
        type: PointUsed.REFUND,
        amount: reservation.paidPoints,
        balanceBefore: reservation.user.pointBalance,
        balanceAfter: reservation.user.pointBalance + reservation.paidPoints,
        reservationId: reservation.id,
      },
    });

    return updated;
  });

  return updatedReservation;
}

// 판매자(SELLER) 예약 관련 서비스

// [판매자] 주간 내 클래스 슬롯 조회
export async function getSellerSlots(
  sellerId: string,
  query: QuerySellerSlotsInput
) {
  // 1. 판매자의 센터 조회
  const center = await reservationRepository.findCenterByOwnerId(sellerId);

  // 2. 센터가 없으면 에러
  if (!center) {
    throw new AppError(404, "센터 정보를 찾을 수 없습니다", "CENTER_NOT_FOUND");
  }

  // 3-8. 슬롯 조회
  const params: {
    centerId: string;
    startDate: Date;
    endDate: Date;
    classId?: string;
  } = {
    centerId: center.id,
    startDate: new Date(query.startDate),
    endDate: new Date(query.endDate),
  };

  if (query.classId) {
    params.classId = query.classId;
  }

  const slots = await reservationRepository.findSlotsByCenterId(params);

  return slots;
}

// [판매자] 내 슬롯에 대한 예약 조회
export async function getSellerReservations(
  sellerId: string,
  query: QueryReservationInput
): Promise<PaginationResponse<any>> {
  // 1. 판매자의 센터 조회
  const center = await reservationRepository.findCenterByOwnerId(sellerId);

  // 2. 센터가 없으면 에러
  if (!center) {
    throw new AppError(404, "센터 정보를 찾을 수 없습니다", "CENTER_NOT_FOUND");
  }

  // 3-4. 필터 조건 구성 및 조회
  const { page = 1, limit = 10, ...restQuery } = query;
  const skip = (page - 1) * limit;

  const where: any = { ...restQuery };
  if (restQuery.startDate || restQuery.endDate) {
    where.slot = where.slot || {};
    where.slot.startAt = {};
    if (restQuery.startDate)
      where.slot.startAt.gte = new Date(restQuery.startDate);
    if (restQuery.endDate) where.slot.startAt.lte = new Date(restQuery.endDate);
  }

  const [items, total] = await Promise.all([
    reservationRepository.findReservationsByCenterId({
      centerId: center.id,
      where,
      skip,
      take: limit,
    }),
    reservationRepository.countReservations({
      ...where,
      class: { centerId: center.id },
    }),
  ]);

  // 5. PaginationResponse 반환
  return {
    data: items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// [판매자] 특정 유저 예약 취소
export async function cancelReservationBySeller(
  sellerId: string,
  reservationId: string,
  data: CancelReservationInput
) {
  // 1. 예약 조회
  const reservation =
    await reservationRepository.findReservationSimple(reservationId);

  // 2. 예약이 없으면 에러
  if (!reservation) {
    throw new AppError(404, "예약을 찾을 수 없습니다", "RESERVATION_NOT_FOUND");
  }

  // 3. 센터 소유자 확인
  if (reservation.class.center.ownerId !== sellerId) {
    throw new AppError(403, "예약 취소 권한이 없습니다", "FORBIDDEN");
  }

  // 4. cancelReservation 호출
  return cancelReservation(sellerId, reservationId, data, UserRole.SELLER);
}

// [판매자] 클래스 수정/삭제시 예약 자동 취소 및 환불
export async function cancelReservationsByClassChange(
  classId: string,
  reason: string
) {
  // 1. 해당 클래스의 모든 미래 BOOKED 예약 조회
  const reservations =
    await reservationRepository.findFutureReservationsByClassId(classId);

  if (reservations.length === 0) {
    return { canceledCount: 0 };
  }

  const now = new Date();

  // 3. Transaction으로 일괄 취소 및 환불
  await prisma.$transaction(async (tx) => {
    for (const reservation of reservations) {
      // 예약 취소
      await tx.reservation.update({
        where: { id: reservation.id },
        data: {
          status: ReservationStatus.CANCELED,
          canceledAt: now,
          canceledBy: UserRole.SELLER,
          cancelNote: reason,
        },
      });

      // 포인트 환불
      await tx.user.update({
        where: { id: reservation.userId },
        data: {
          pointBalance: {
            increment: reservation.paidPoints,
          },
        },
      });

      // 포인트 내역 생성
      await tx.pointHistory.create({
        data: {
          userId: reservation.userId,
          type: PointUsed.REFUND,
          amount: reservation.paidPoints,
          balanceBefore: reservation.user.pointBalance,
          balanceAfter: reservation.user.pointBalance + reservation.paidPoints,
          reservationId: reservation.id,
        },
      });
    }
  });

  // 4. 취소된 예약 개수 반환
  return { canceledCount: reservations.length };
}

// [판매자] 슬롯 삭제시 예약 자동 취소 및 환불
export async function cancelReservationsBySlotChange(
  slotId: string,
  reason: string
) {
  // 1. 해당 슬롯의 BOOKED 예약 조회
  const reservations =
    await reservationRepository.findReservationsBySlotId(slotId);

  if (reservations.length === 0) {
    return { canceledCount: 0 };
  }

  const now = new Date();

  // 2. Transaction으로 일괄 취소 및 환불
  await prisma.$transaction(async (tx) => {
    for (const reservation of reservations) {
      // 예약 취소
      await tx.reservation.update({
        where: { id: reservation.id },
        data: {
          status: ReservationStatus.CANCELED,
          canceledAt: now,
          canceledBy: UserRole.SELLER,
          cancelNote: reason,
        },
      });

      // 포인트 환불
      await tx.user.update({
        where: { id: reservation.userId },
        data: {
          pointBalance: {
            increment: reservation.paidPoints,
          },
        },
      });

      // 포인트 내역 생성
      await tx.pointHistory.create({
        data: {
          userId: reservation.userId,
          type: PointUsed.REFUND,
          amount: reservation.paidPoints,
          balanceBefore: reservation.user.pointBalance,
          balanceAfter: reservation.user.pointBalance + reservation.paidPoints,
          reservationId: reservation.id,
        },
      });
    }
  });

  // 3. 취소된 예약 개수 반환
  return { canceledCount: reservations.length };
}

// [판매자] 예약 완료 처리
export async function completeReservation(
  sellerId: string,
  reservationId: string,
  now: Date = new Date()
) {
  // 1. 예약 조회
  const reservation =
    await reservationRepository.findReservationSimple(reservationId);

  // 2. 예약이 없으면 에러
  if (!reservation) {
    throw new AppError(404, "예약을 찾을 수 없습니다", "RESERVATION_NOT_FOUND");
  }

  // 3. 센터 소유자 확인
  if (reservation.class.center.ownerId !== sellerId) {
    throw new AppError(403, "예약 완료 처리 권한이 없습니다", "FORBIDDEN");
  }

  // 4. 상태가 BOOKED가 아니면 에러
  if (reservation.status !== ReservationStatus.BOOKED) {
    throw new AppError(400, "예약 상태가 유효하지 않습니다", "INVALID_STATUS");
  }

  // 5. 슬롯 종료 시간이 아직 안 지났으면 에러
  if (reservation.slot.endAt > now) {
    throw new AppError(
      400,
      "수업 종료 후 완료 처리가 가능합니다",
      "CLASS_NOT_ENDED"
    );
  }

  // 6. 예약 업데이트
  const updatedReservation = await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      status: ReservationStatus.COMPLETED,
      completedAt: now,
    },
  });

  return updatedReservation;
}

// 관리자(ADMIN) 예약 관련 서비스

// [관리자] 최근 한달 예약 횟수 통계
export async function getReservationStats(query: QueryReservationStatsInput) {
  // 1. startDate, endDate 설정
  const endDate = query.endDate ? new Date(query.endDate) : new Date();
  const startDate = query.startDate
    ? new Date(query.startDate)
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30일 전

  // 2-6. 통계 조회
  const [stats, dailyReservations] = await Promise.all([
    reservationRepository.getReservationStats({ startDate, endDate }),
    reservationRepository.getDailyReservationCounts({ startDate, endDate }),
  ]);

  // 3. 상태별 예약 횟수 매핑
  const statusBreakdown = {
    BOOKED: 0,
    CANCELED: 0,
    COMPLETED: 0,
  };

  stats.statusBreakdown.forEach((item) => {
    if (item.status === ReservationStatus.BOOKED) {
      statusBreakdown.BOOKED = item._count;
    } else if (item.status === ReservationStatus.CANCELED) {
      statusBreakdown.CANCELED = item._count;
    } else if (item.status === ReservationStatus.COMPLETED) {
      statusBreakdown.COMPLETED = item._count;
    }
  });

  // 7. 통계 객체 반환
  return {
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    totalReservations: stats.totalCount,
    statusBreakdown,
    dailyReservations,
    totalRevenue: stats.totalRevenue,
    totalRefund: stats.totalRefund,
  };
}
