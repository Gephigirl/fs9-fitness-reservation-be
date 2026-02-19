import { Router } from "express";
import { getUsersHandler, getUserStatsHandler, getUserByIdHandler, updateProfileHandler, patchUserNoteHandler } from "./user.controller.ts";
import { validate } from "../../middlewares/validate.ts";
import { getUsersSchema, updateProfileSchema, patchUserNoteSchema } from "./user.validation.ts";
import { authenticate, requireRole } from "../../middlewares/auth.ts";
import { uploadProfileImage } from "../../middlewares/upload.ts";
import { UserRole } from "@prisma/client";

const router = Router();

// GET /users/stats - 회원 통계 조회 (ADMIN)
router.get("/stats", authenticate, requireRole(UserRole.ADMIN), getUserStatsHandler);

// PATCH /users/me - 내 프로필 수정 (로그인 유저)
router.patch(
  "/me",
  authenticate,
  uploadProfileImage,
  validate(updateProfileSchema),
  updateProfileHandler,
);

// GET /users - 회원 목록 조회 (ADMIN)
router.get(
  "/",
  authenticate,
  requireRole(UserRole.ADMIN),
  validate(getUsersSchema),
  getUsersHandler
);

// GET /users/:id - 회원 상세 조회 (ADMIN or 본인)
router.get("/:id", authenticate, getUserByIdHandler);

// PATCH /users/:id/note - 회원 메모만 수정 (ADMIN)
router.patch(
  "/:id/note",
  authenticate,
  requireRole(UserRole.ADMIN),
  validate(patchUserNoteSchema),
  patchUserNoteHandler,
);

export default router;
