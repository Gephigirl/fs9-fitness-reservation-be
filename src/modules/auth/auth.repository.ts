import { type UserRole, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

type UserCreateInput = Prisma.UserCreateInput;

async function findById(id: string) {
  return prisma.user.findUnique({
    where: {
      id,
    },
  });
}

async function findByEmail(email: string) {
  return await prisma.user.findUnique({
    where: {
      email,
    },
  });
}

async function save(user: UserCreateInput) {
  return prisma.user.create({
    data: user,
  });
}

async function update(id: string, data: any) {
  return prisma.user.update({
    where: {
      id,
    },
    data: data,
  });
}

export default {
  findById,
  findByEmail,
  save,
  update,
};