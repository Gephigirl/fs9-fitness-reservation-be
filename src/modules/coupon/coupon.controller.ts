import type { Request, Response } from "express";
import { UserRole } from "@prisma/client";
import type { AuthRequest } from "../../middlewares/auth.ts";
import { createCouponTemplateSchema, giveCouponSchema, updateCouponTemplateSchema } from "./coupon.validation.ts";
import * as couponService from "./coupon.service.ts";

// 쿠폰 템플릿 생성
export const createCoupon = async (req: Request, res: Response) => {
  try {
    const { id: issuerId, role } = (req as AuthRequest).user;

    // 판매자 또는 관리자만 쿠폰 템플릿 생성 가능
    if (role !== UserRole.ADMIN && role !== UserRole.SELLER) {
      return res.status(403).json({ success: false, message: "권한이 없습니다." });
    }

    const input = createCouponTemplateSchema.parse(req.body);

    const coupon = await couponService.createCouponTemplate(issuerId, role, input);

    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

// 내가 만든 쿠폰 목록 조회
export const getMyCoupons = async (req: Request, res: Response) => {
  try {
    const { id: issuerId } = (req as AuthRequest).user;
    const coupons = await couponService.getMyTemplates(issuerId);

    res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// 쿠폰 지급
export const giveCoupon = async (req: Request, res: Response) => {
  try {
    const { id: issuerId } = (req as AuthRequest).user; // 발급자
    const input = giveCouponSchema.parse(req.body);

    const result = await couponService.giveCoupon(issuerId, input);

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

// 쿠폰 템플릿 수정
export const updateCoupon = async (req: Request, res: Response) => {
  try {
    const { id: issuerId, role } = (req as AuthRequest).user;
    const { id } = req.params;
    
    // 유효성: role check
    if (role !== UserRole.ADMIN && role !== UserRole.SELLER) {
        return res.status(403).json({ success: false, message: "권한이 없습니다." });
    }

    const input = updateCouponTemplateSchema.parse(req.body);

    const result = await couponService.updateCouponTemplate(issuerId, id as string, input);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

// 쿠폰 템플릿 삭제
export const deleteCoupon = async (req: Request, res: Response) => {
  try {
    const { id: issuerId, role } = (req as AuthRequest).user;
    const { id } = req.params;
    
    if (role !== UserRole.ADMIN && role !== UserRole.SELLER) {
        return res.status(403).json({ success: false, message: "권한이 없습니다." });
    }

    await couponService.deleteCouponTemplate(issuerId, id as string);
    res.status(200).json({ success: true, message: "쿠폰이 삭제되었습니다." });
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

// 특정 유저의 쿠폰함 조회
export const getUserCoupons = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { id: requesterId, role } = (req as AuthRequest).user;

    // 본인 확인 또는 관리자 확인
    if (role !== UserRole.ADMIN && requesterId !== userId) {
      return res.status(403).json({ success: false, message: "접근 권한이 없습니다." });
    }

    const coupons = await couponService.getUserCoupons(userId as string);
    res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};
