import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import {
  chargePointSchema,
  queryMyPointHistorySchema,
  adjustPointSchema,
  queryAdminPointHistorySchema,
  querySellerSettlementSchema,
  querySellerTransactionsSchema,
} from "./point.validation.js";
import {
  getMyBalanceHandler,
  getMyPointHistoryHandler,
  chargePointHandler,
  adjustPointHandler,
  getAdminPointHistoryHandler,
  getSellerSettlementHandler,
  getSellerTransactionsHandler,
} from "./point.controller.js";

const router = Router();

// 내 포인트 잔액 조회
router.get("/me", authenticate, getMyBalanceHandler);

// 내 포인트 내역 조회
router.get(
  "/me/history",
  authenticate,
  validate(queryMyPointHistorySchema),
  getMyPointHistoryHandler
);

// 포인트 충전
router.post(
  "/charge",
  authenticate,
  requireRole("CUSTOMER", "SELLER"),
  validate(chargePointSchema),
  chargePointHandler
);


// 매출 정산 요약 + 클래스별 매출
router.get(
  "/seller/settlement",
  authenticate,
  requireRole("SELLER"),
  validate(querySellerSettlementSchema),
  getSellerSettlementHandler
);

// 거래 내역 조회
router.get(
  "/seller/transactions",
  authenticate,
  requireRole("SELLER"),
  validate(querySellerTransactionsSchema),
  getSellerTransactionsHandler
);


// 포인트 지급/회수
router.post(
  "/admin/adjust",
  authenticate,
  requireRole("ADMIN"),
  validate(adjustPointSchema),
  adjustPointHandler
);

// 전체 포인트 내역 조회
router.get(
  "/admin/history",
  authenticate,
  requireRole("ADMIN"),
  validate(queryAdminPointHistorySchema),
  getAdminPointHistoryHandler
);

export default router;
