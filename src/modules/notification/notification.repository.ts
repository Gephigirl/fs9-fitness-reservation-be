import prisma from "../../config/prisma.js";
import { Prisma } from "@prisma/client";

export async function createNotification(
  data: Prisma.NotificationUncheckedCreateInput,
) {
  return prisma.notification.create({
    data,
  });
}

export async function findNotificationById(id: string) {
  return prisma.notification.findUnique({
    where: { id },
  });
}

export async function findManyNotifications(params: {
  userId: string;
  skip: number;
  take: number;
}) {
  return prisma.notification.findMany({
    where: { userId: params.userId },
    skip: params.skip,
    take: params.take,
    orderBy: { createdAt: "desc" },
  });
}

export async function countNotifications(userId: string) {
  return prisma.notification.count({
    where: { userId },
  });
}

export async function updateNotification(
  id: string,
  data: Prisma.NotificationUpdateInput,
) {
  return prisma.notification.update({
    where: { id },
    data,
  });
}

export async function deleteNotification(id: string) {
  return prisma.notification.delete({
    where: { id },
  });
}
