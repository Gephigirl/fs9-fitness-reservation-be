import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/auth.ts";
import { validate } from "../../middlewares/validate.ts";
import {
  createNotificationHandler,
  deleteNotificationHandler,
  getNotificationByIdHandler,
  listNotificationsHandler,
  streamNotificationsHandler,
  updateNotificationHandler,
} from "./notification.controller.ts";
import {
  createNotificationSchema,
  listNotificationsSchema,
  notificationIdParamSchema,
  updateNotificationSchema,
} from "./notification.validation.ts";

const router = Router();

// POST /notifications - 알림 생성 (ADMIN)
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  validate(createNotificationSchema),
  createNotificationHandler,
);

// GET /notifications/stream - SSE 스트림 (로그인 필요)
// NOTE: "/:id" 보다 먼저 선언해야 stream이 id로 잡히지 않습니다.
router.get("/stream", authenticate, streamNotificationsHandler);

// GET /notifications - 내 알림 목록 (ADMIN은 userId query로 조회 가능)
router.get(
  "/",
  authenticate,
  validate(listNotificationsSchema),
  listNotificationsHandler,
);

// GET /notifications/:id - 알림 단건 조회
router.get(
  "/:id",
  authenticate,
  validate(notificationIdParamSchema),
  getNotificationByIdHandler,
);

// PATCH /notifications/:id - 알림 수정 (ADMIN)
router.patch(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  validate(updateNotificationSchema),
  updateNotificationHandler,
);

// DELETE /notifications/:id - 알림 삭제 (ADMIN 또는 본인)
router.delete(
  "/:id",
  authenticate,
  validate(notificationIdParamSchema),
  deleteNotificationHandler,
);

export default router;
