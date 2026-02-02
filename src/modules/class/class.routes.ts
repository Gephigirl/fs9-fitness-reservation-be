import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import {
  uploadClassImages,
  handleUploadError,
} from "../../middlewares/upload.js";

import {
  createClassHandler,
  getClassesHandler,
  getClassByIdHandler,
  updateClassHandler,
  deleteClassHandler,
  approveClassHandler,
  rejectClassHandler,
  createSlotHandler,
  updateSlotHandler,
  deleteSlotHandler,
} from "./class.controller.js";

import {
  createClassSchema,
  updateClassSchema,
  queryClassSchema,
  approveClassSchema,
  rejectClassSchema,
  createSlotSchema,
  updateSlotSchema,
} from "./class.validation.js";

const router = Router();

// GET /classes - 클래스 목록 조회
router.get("/", validate(queryClassSchema), getClassesHandler);

// GET /classes/:id - 클래스 상세 조회
router.get("/:id", getClassByIdHandler);

// POST /classes - 클래스 생성 (판매자, 인증 필요)
router.post(
  "/",
  authenticate,
  requireRole("SELLER"),
  uploadClassImages,
  handleUploadError,
  validate(createClassSchema),
  createClassHandler,
);

// PATCH /classes/:id - 클래스 수정 (판매자, 인증 필요)
router.patch(
  "/:id",
  authenticate,
  requireRole("SELLER"),
  uploadClassImages,
  handleUploadError,
  validate(updateClassSchema),
  updateClassHandler,
);

// DELETE /classes/:id - 클래스 삭제 (판매자, 인증 필요)
router.delete("/:id", authenticate, requireRole("SELLER"), deleteClassHandler);

// PATCH /classes/:id/approve - 클래스 승인 (관리자, 인증 필요)
router.patch(
  "/:id/approve",
  authenticate,
  requireRole("ADMIN"),
  validate(approveClassSchema),
  approveClassHandler,
);

// PATCH /classes/:id/reject - 클래스 반려 (관리자, 인증 필요)
router.patch(
  "/:id/reject",
  authenticate,
  requireRole("ADMIN"),
  validate(rejectClassSchema),
  rejectClassHandler,
);

// POST /classes/:id/slots - 슬롯 생성 (판매자, 인증 필요)
router.post(
  "/:id/slots",
  authenticate,
  requireRole("SELLER"),
  validate(createSlotSchema),
  createSlotHandler,
);


// PATCH /classes/:classId/slots/:slotId - 슬롯 수정 (판매자, 인증 필요)
router.patch(
  "/:classId/slots/:slotId",
  authenticate,
  requireRole("SELLER"),
  validate(updateSlotSchema),
  updateSlotHandler,
);

// DELETE /classes/:classId/slots/:slotId - 슬롯 삭제 (판매자, 인증 필요)
router.delete(
  "/:classId/slots/:slotId",
  authenticate,
  requireRole("SELLER"),
  deleteSlotHandler,
);

export default router;
