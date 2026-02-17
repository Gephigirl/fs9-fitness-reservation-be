import { Router } from "express";
import { getUsersHandler, getUserStatsHandler, getUserByIdHandler, updateProfileHandler } from "./user.controller.ts";
import { validate } from "../../middlewares/validate.ts";
import { getUsersSchema, updateProfileSchema } from "./user.validation.ts";
import { authenticate } from "../../middlewares/auth.ts";
import { uploadProfileImage } from "../../middlewares/upload.ts";

const router = Router();

// GET /users/stats - 회원 통계 조회
router.get("/stats", getUserStatsHandler);

// PATCH /users/me - 내 프로필 수정
router.patch(
  "/me",
  authenticate,
  uploadProfileImage,
  validate(updateProfileSchema),
  updateProfileHandler,
);

// GET /users - 회원 목록 조회
router.get(
  "/",
  validate(getUsersSchema),
  getUsersHandler
);

// GET /users/:id - 회원 상세 조회
router.get("/:id", getUserByIdHandler);

export default router;
