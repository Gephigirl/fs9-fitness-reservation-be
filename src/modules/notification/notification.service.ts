import { AppError } from "../../middlewares/errorHandler.ts";
import type { UserRole } from "@prisma/client";
import * as notificationRepo from "./notification.repository.ts";
import { publishToUser } from "./notification.sse.ts";
import type {
  CreateNotificationInput,
  ListNotificationsQuery,
  UpdateNotificationInput,
} from "./notification.validation.ts";

type AuthUser = {
  id: string;
  role: UserRole;
};

export async function createNotification(input: CreateNotificationInput) {
  const created = await notificationRepo.createNotification({
    userId: input.userId,
    title: input.title,
    body: input.body ?? null,
    linkUrl: input.linkUrl ?? null,
  });
  publishToUser(created.userId, "notification.created", created);
  return created;
}

export async function listNotifications(authUser: AuthUser, query: ListNotificationsQuery) {
  // NOTE: 런타임에서 string으로 들어오는 케이스를 방어합니다.
  const page = Number((query as any).page ?? 1);
  const limit = Number((query as any).limit ?? 20);
  const safePage = Number.isFinite(page) && page >= 1 ? page : 1;
  const safeLimit =
    Number.isFinite(limit) && limit >= 1 && limit <= 100 ? limit : 20;

  const targetUserId =
    authUser.role === "ADMIN" && query.userId ? query.userId : authUser.id;

  const skip = (safePage - 1) * safeLimit;

  const [items, total] = await Promise.all([
    notificationRepo.findManyNotifications({
      userId: targetUserId,
      skip,
      take: safeLimit,
    }),
    notificationRepo.countNotifications(targetUserId),
  ]);

  return {
    items,
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: Math.ceil(total / safeLimit),
  };
}

export async function getNotificationById(authUser: AuthUser, id: string) {
  const n = await notificationRepo.findNotificationById(id);
  if (!n) {
    throw new AppError(404, "알림을 찾을 수 없습니다", "NOT_FOUND");
  }

  if (authUser.role !== "ADMIN" && n.userId !== authUser.id) {
    throw new AppError(403, "권한이 없습니다", "FORBIDDEN");
  }

  return n;
}

export async function updateNotificationById(
  authUser: AuthUser,
  id: string,
  input: UpdateNotificationInput,
) {
  if (authUser.role !== "ADMIN") {
    throw new AppError(403, "권한이 없습니다", "FORBIDDEN");
  }

  const before = await getNotificationById(authUser, id);

  const updated = await notificationRepo.updateNotification(id, {
    ...(input.title !== undefined && { title: input.title }),
    ...(input.body !== undefined && { body: input.body }),
    ...(input.linkUrl !== undefined && { linkUrl: input.linkUrl }),
  });

  publishToUser(before.userId, "notification.updated", updated);
  return updated;
}

export async function deleteNotificationById(authUser: AuthUser, id: string) {
  const n = await notificationRepo.findNotificationById(id);
  if (!n) {
    throw new AppError(404, "알림을 찾을 수 없습니다", "NOT_FOUND");
  }

  if (authUser.role !== "ADMIN" && n.userId !== authUser.id) {
    throw new AppError(403, "권한이 없습니다", "FORBIDDEN");
  }

  await notificationRepo.deleteNotification(id);
  publishToUser(n.userId, "notification.deleted", { id });
  return { deleted: true };
}
