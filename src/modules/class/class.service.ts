import { ClassStatus, UserRole } from '@prisma/client';
import type {
  CreateClassInput,
  UpdateClassInput,
  QueryClassInput,
  RejectClassInput,
  CreateSlotInput,
  UpdateSlotInput,
} from './class.validation.js';
import type { PaginationResponse } from '../../types/common.types.js';
import * as classRepository from './class.repository.js';

 
// 클래스 생성
export async function createClass(userId: string, data: CreateClassInput) {
  const center = await classRepository.findCenterByOwnerId(userId);

  if (!center) {
    throw new Error('센터 정보를 찾을 수 없습니다');
  }

  const newClass = await classRepository.createClass({
    center: { connect: { id: center.id } },
    title: data.title,
    category: data.category,
    level: data.level,
    description: data.description ?? null,
    notice: data.notice ?? null,
    pricePoints: data.pricePoints,
    capacity: data.capacity,
    bannerUrl: data.bannerUrl ?? null,
    imgUrls: data.imgUrls,
    status: ClassStatus.PENDING,
  });

  return newClass;
}

// 클래스 목록 조회

export async function getClasses(query: QueryClassInput, userRole?: UserRole): Promise<PaginationResponse<Awaited<ReturnType<typeof classRepository.findManyClasses>>[0]>> {
  const { category, level, status, centerId, page = 1, limit = 10 } = query;

  const where: any = {};
  if (category) where.category = category;
  if (level) where.level = level;
  if (centerId) where.centerId = centerId;
  
  if (userRole === UserRole.CUSTOMER) { // customer는 승인된 클래스만 볼 수 있음
    where.status = ClassStatus.APPROVED;
  } else {
    if (status) where.status = status;
  }

  const skip = (page - 1) * limit;

  const [classes, total] = await Promise.all([
    classRepository.findManyClasses({ where, skip, take: limit }),
    classRepository.countClasses(where),
  ]);

  return {
    data: classes,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// 클래스 상세 조회

export async function getClassById(classId: string, userRole?: UserRole) {
  const classData = await classRepository.findClassById(classId, new Date());

  if (!classData) {
    throw new Error('클래스를 찾을 수 없습니다');
  }

  if (userRole === UserRole.CUSTOMER && classData.status === ClassStatus.REJECTED) {
    throw new Error('클래스를 찾을 수 없습니다');
  }

  return classData;
}

// 클래스 수정

export async function updateClass(userId: string, classId: string, data: UpdateClassInput) {
  const existingClass = await classRepository.findClassWithCenter(classId);

  if (!existingClass) {
    throw new Error('클래스를 찾을 수 없습니다');
  }

  if (existingClass.center.ownerId !== userId) {
    throw new Error('클래스 수정 권한이 없습니다');
  }

  // 클래스 수정 시 모든 예약 취소
  await classRepository.cancelAllReservationsForClass(classId);

  const updateData = {
    title: data.title !== undefined ? data.title : existingClass.title,
    category: data.category !== undefined ? data.category : existingClass.category,
    level: data.level !== undefined ? data.level : existingClass.level,
    description: data.description !== undefined ? data.description : (existingClass.description ?? null),
    notice: data.notice !== undefined ? data.notice : (existingClass.notice ?? null),
    pricePoints: data.pricePoints !== undefined ? data.pricePoints : existingClass.pricePoints,
    capacity: data.capacity !== undefined ? data.capacity : existingClass.capacity,
    bannerUrl: data.bannerUrl !== undefined ? data.bannerUrl : (existingClass.bannerUrl ?? null),
    imgUrls: data.imgUrls !== undefined ? data.imgUrls : existingClass.imgUrls,
  };

  // 클래스 정원이 변경되면 모든 슬롯 정원도 업데이트
  if (data.capacity !== undefined && data.capacity !== existingClass.capacity) {
    await classRepository.updateAllSlotsCapacity(classId, data.capacity);
  }

  const updatedClass = await classRepository.updateClass(classId, updateData);

  return updatedClass;
}

// 클래스 삭제

export async function deleteClass(userId: string, classId: string) {
  const existingClass = await classRepository.findClassWithCenter(classId);

  if (!existingClass) {
    throw new Error('클래스를 찾을 수 없습니다');
  }

  if (existingClass.center.ownerId !== userId) {
    throw new Error('클래스 삭제 권한이 없습니다');
  }

  await classRepository.cancelAllReservationsForClass(classId);
  await classRepository.deleteClass(classId);

  return { message: '클래스가 삭제되었습니다' };
}

// 클래스 승인

export async function approveClass(classId: string) {
  const existingClass = await classRepository.findClassSimple(classId);

  if (!existingClass) {
    throw new Error('클래스를 찾을 수 없습니다');
  }

  if (existingClass.status !== ClassStatus.PENDING) {
    throw new Error('승인 대기 중인 클래스만 처리할 수 있습니다');
  }

  const updatedClass = await classRepository.updateClassStatus(classId, ClassStatus.APPROVED);

  return updatedClass;
}

// 클래스 반려

export async function rejectClass(classId: string, data: RejectClassInput) {
  const existingClass = await classRepository.findClassSimple(classId);

  if (!existingClass) {
    throw new Error('클래스를 찾을 수 없습니다');
  }

  if (existingClass.status !== ClassStatus.PENDING) {
    throw new Error('승인 대기 중인 클래스만 처리할 수 있습니다');
  }

  const updatedClass = await classRepository.updateClassStatus(classId, ClassStatus.REJECTED, data.rejectReason);

  return updatedClass;
}

// 슬롯 생성

export async function createSlot(userId: string, classId: string, data: CreateSlotInput, now: Date = new Date()) {
  const classData = await classRepository.findClassWithCenterForSlot(classId);

  if (!classData) {
    throw new Error('클래스를 찾을 수 없습니다');
  }

  if (classData.center.ownerId !== userId) {
    throw new Error('슬롯 생성 권한이 없습니다');
  }

  if (data.capacity > classData.capacity) {
    throw new Error(`슬롯 정원은 클래스 정원(${classData.capacity}명) 이하여야 합니다`);
  }

  const startAt = new Date(`${data.date}T${String(data.hour).padStart(2, '0')}:00:00+09:00`);
  
  if (isNaN(startAt.getTime())) {
    throw new Error('올바른 날짜 형식이 아닙니다');
  }
  
  if (startAt < now) {
    throw new Error('과거 날짜는 슬롯으로 생성할 수 없습니다');
  }

  const endAt = new Date(startAt);
  endAt.setHours(endAt.getHours() + 1);

  const overlappingSlot = await classRepository.findOverlappingSlot(classId, startAt, endAt);

  if (overlappingSlot) {
    throw new Error('해당 시간대에 이미 슬롯이 존재합니다');
  }

  const newSlot = await classRepository.createSlot({
    classId,
    startAt,
    endAt,
    capacity: data.capacity,
    isOpen: data.isOpen,
  });

  return newSlot;
}

// 슬롯 수정

export async function updateSlot(userId: string, slotId: string, data: UpdateSlotInput) {
  const slot = await classRepository.findSlotWithClassAndReservations(slotId);

  if (!slot) {
    throw new Error('슬롯을 찾을 수 없습니다');
  }

  if (slot.class.center.ownerId !== userId) {
    throw new Error('슬롯 수정 권한이 없습니다');
  }

  const updatedSlot = await classRepository.updateSlot(slotId, data);

  return updatedSlot;
}

// 슬롯 삭제

export async function deleteSlot(userId: string, slotId: string) {
  const slot = await classRepository.findSlotWithClassAndReservations(slotId);

  if (!slot) {
    throw new Error('슬롯을 찾을 수 없습니다');
  }

  if (slot.class.center.ownerId !== userId) {
    throw new Error('슬롯 삭제 권한이 없습니다');
  }

  // 슬롯 삭제 시 모든 예약 취소
  await classRepository.cancelAllReservationsForSlot(slotId);

  await classRepository.deleteSlot(slotId);

  return { message: '슬롯이 삭제되었습니다' };
}
