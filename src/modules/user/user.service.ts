import { UserRole } from "@prisma/client";
import bcrypt from "bcrypt";
import * as userRepository from "./user.repository.ts";
import { AppError } from "../../middlewares/errorHandler.ts";

// 회원 목록 조회
export async function getUsers({
  page,
  limit,
  role,
  searchType,
  search,
}: {
  page: number;
  limit: number;
  role?: string | undefined;
  searchType?: string | undefined;
  search?: string | undefined;
}) {
  const validRole = Object.values(UserRole).includes(role as UserRole)
    ? (role as UserRole)
    : undefined;

  const validSearchType = ["nickname", "email", "phone"].includes(
    searchType as string
  )
    ? (searchType as "nickname" | "email" | "phone")
    : undefined;

  const { users, totalCount } = await userRepository.findManyUsers({
    page,
    limit,
    role: validRole,
    searchType: validSearchType,
    search,
  });

  const formattedUsers = users.map((user) => ({
    ...user,
    couponCount: user._count.userCoupons,
  }));

  return { users: formattedUsers, totalCount };
}

// 회원 상세 조회
export async function getUserById(userId: string) {
  const user = await userRepository.findUserById(userId);

  if (!user) {
    throw new AppError(404, "회원을 찾을 수 없습니다", "USER_NOT_FOUND");
  }

  return {
    ...user,
    couponCount: user._count.userCoupons,
    reservationCount: user._count.reservations,
    reviewCount: user._count.reviews,
  };
}

// 회원 통계 조회
export async function getUserStats() {
  return userRepository.getUserStats();
}

// 내 프로필 수정
export async function updateProfile(
  userId: string,
  data: {
    nickname?: string;
    phone?: string;
    password?: string;
    introduction?: string;
  },
  profileImgUrl?: string,
) {
  const updateData: Record<string, any> = {};

  if (data.nickname !== undefined) updateData.nickname = data.nickname;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.introduction !== undefined) updateData.introduction = data.introduction;

  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  if (profileImgUrl !== undefined) {
    updateData.profileImgUrl = profileImgUrl;
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError(400, "수정할 항목이 없습니다", "NO_UPDATE_DATA");
  }

  return userRepository.updateUser(userId, updateData);
}
