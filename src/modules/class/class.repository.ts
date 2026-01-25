import prisma from '../../config/prisma.js';
import { ClassStatus, Prisma } from '@prisma/client';


export async function findCenterByOwnerId(ownerId: string) {
  return prisma.center.findUnique({
    where: { ownerId },
  });
}

export async function createClass(data: Prisma.ClassCreateInput) {
  return prisma.class.create({
    data,
    include: {
      center: true,
    },
  });
}

export async function findManyClasses(params: {
  where: Prisma.ClassWhereInput;
  skip: number;
  take: number;
}) {
  return prisma.class.findMany({
    where: params.where,
    skip: params.skip,
    take: params.take,
    include: {
      center: {
        select: {
          id: true,
          name: true,
          address1: true,
        },
      },
      _count: {
        select: {
          reviews: true,
          reservations: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function countClasses(where: Prisma.ClassWhereInput) {
  return prisma.class.count({ where });
}

export async function findClassById(classId: string, now: Date = new Date()) {
  return prisma.class.findUnique({
    where: { id: classId },
    include: {
      center: {
        select: {
          id: true,
          name: true,
          address1: true,
          address2: true,
          introduction: true,
          businessHours: true,
          lat: true,
          lng: true,
        },
      },
      slots: {
        where: {
          startAt: {
            gte: now,
          },
        },
        orderBy: {
          startAt: 'asc',
        },
        include: {
          _count: {
            select: {
              reservations: {
                where: {
                  status: 'BOOKED',
                },
              },
            },
          },
        },
      },
      reviews: {
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              profileImgUrl: true,
            },
          },
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
  });
}

export async function findClassWithCenter(classId: string) {
  return prisma.class.findUnique({
    where: { id: classId },
    include: {
      center: true,
    },
  });
}

export async function findClassWithReservationCount(classId: string) {
  return prisma.class.findUnique({
    where: { id: classId },
    include: {
      center: true,
      _count: {
        select: {
          reservations: {
            where: {
              status: {
                in: ['BOOKED', 'COMPLETED'],
              },
            },
          },
        },
      },
    },
  });
}

export async function updateClass(classId: string, data: Prisma.ClassUpdateInput) {
  return prisma.class.update({
    where: { id: classId },
    data,
    include: {
      center: true,
    },
  });
}

export async function deleteClass(classId: string) {
  return prisma.class.delete({
    where: { id: classId },
  });
}

export async function findClassSimple(classId: string) {
  return prisma.class.findUnique({
    where: { id: classId },
  });
}

export async function updateClassStatus(classId: string, status: ClassStatus, rejectReason?: string) {
  return prisma.class.update({
    where: { id: classId },
    data: {
      status,
      ...(rejectReason && { rejectReason }),
    },
    include: {
      center: {
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              nickname: true,
            },
          },
        },
      },
    },
  });
}


export async function findClassWithCenterForSlot(classId: string) {
  return prisma.class.findUnique({
    where: { id: classId },
    include: {
      center: true,
    },
  });
}
export async function findOverlappingSlot(classId: string, startAt: Date, endAt: Date) {
  return prisma.classSlot.findFirst({
    where: {
      classId,
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
  });
}
export async function createSlot(data: Prisma.ClassSlotUncheckedCreateInput) {
  return prisma.classSlot.create({
    data,
  });
}

export async function findSlotWithClassAndReservations(slotId: string) {
  return prisma.classSlot.findUnique({
    where: { id: slotId },
    include: {
      class: {
        include: {
          center: true,
        },
      },
      _count: {
        select: {
          reservations: {
            where: {
              status: 'BOOKED',
            },
          },
        },
      },
    },
  });
}

export async function updateSlot(slotId: string, data: Prisma.ClassSlotUpdateInput) {
  return prisma.classSlot.update({
    where: { id: slotId },
    data,
  });
}

export async function findSlotForDelete(slotId: string) {
  return prisma.classSlot.findUnique({
    where: { id: slotId },
    include: {
      class: {
        include: {
          center: true,
        },
      },
      _count: {
        select: {
          reservations: {
            where: {
              status: {
                in: ['BOOKED', 'COMPLETED'],
              },
            },
          },
        },
      },
    },
  });
}

export async function deleteSlot(slotId: string) {
  return prisma.classSlot.delete({
    where: { id: slotId },
  });
}
