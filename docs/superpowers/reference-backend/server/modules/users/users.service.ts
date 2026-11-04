import { prisma } from "../../db";
import { publicUserSelect, type PublicUser } from "../../lib/selects";
import { badRequest, notFound } from "../../http/errors";
import { hashPassword } from "../auth/auth.service";
import type { CreateUserInput, UpdateUserInput, UserListQuery } from "@/shared/schemas";
import type { Prisma } from "../../generated/prisma/client";

export async function list({ q, page, limit }: UserListQuery) {
  const where: Prisma.UserWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};
  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: publicUserSelect,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);
  return { items, total };
}

export async function get(id: number) {
  const user = await prisma.user.findUnique({ where: { id }, select: publicUserSelect });
  if (!user) throw notFound("User");
  return user;
}

export async function create({ password, ...input }: CreateUserInput) {
  return prisma.user.create({
    data: { ...input, passwordHash: await hashPassword(password) },
    select: publicUserSelect,
  });
}

export async function update(actor: PublicUser, id: number, input: UpdateUserInput) {
  // Keeps at least one Admin in the system: the last one cannot demote themselves.
  if (id === actor.id && input.role && input.role !== actor.role) {
    throw badRequest("You cannot change your own role");
  }
  const { password, ...fields } = input;
  return prisma.user.update({
    where: { id },
    data: { ...fields, ...(password && { passwordHash: await hashPassword(password) }) },
    select: publicUserSelect,
  });
}

export async function remove(actor: PublicUser, id: number) {
  if (id === actor.id) throw badRequest("You cannot delete your own account");
  await prisma.user.delete({ where: { id } });
}
