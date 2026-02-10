import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../../middlewares/auth.ts";
import * as notificationService from "./notification.service.ts";
import { addClient, publishConnected, publishPing, removeClient } from "./notification.sse.ts";

// POST /notifications (ADMIN)
export async function createNotificationHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const created = await notificationService.createNotification(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
}

// GET /notifications/stream (SSE)
export async function streamNotificationsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthRequest;

    // SSE 헤더 세팅 (writeHead 대신 Express setHeader 사용)
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    // nginx 등 프록시 버퍼링 방지
    res.setHeader("X-Accel-Buffering", "no");

    // 헤더 즉시 flush
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (res as any).flushHeaders?.();

    publishConnected(res);
    addClient(authReq.user.id, res);

    // keep-alive ping (대부분의 프록시/브라우저 연결 유지를 위해 필요)
    const heartbeat = setInterval(() => {
      publishPing(res);
    }, 25_000);

    req.on("close", () => {
      clearInterval(heartbeat);
      removeClient(authReq.user.id, res);
      res.end();
    });
  } catch (error) {
    next(error);
  }
}

// GET /notifications (내 알림 / ADMIN은 userId로 조회 가능)
export async function listNotificationsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthRequest;
    const result = await notificationService.listNotifications(authReq.user, req.query as any);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

// GET /notifications/:id
export async function getNotificationByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    const result = await notificationService.getNotificationById(authReq.user, id as string);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

// PATCH /notifications/:id (ADMIN)
export async function updateNotificationHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    const updated = await notificationService.updateNotificationById(authReq.user, id as string, req.body);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

// DELETE /notifications/:id (ADMIN 또는 본인)
export async function deleteNotificationHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    const result = await notificationService.deleteNotificationById(authReq.user, id as string);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
