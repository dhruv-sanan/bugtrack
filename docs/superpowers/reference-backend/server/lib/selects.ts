import type { Prisma } from "../generated/prisma/client";

// Every user read goes through a select, so passwordHash cannot leak by accident.
export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export const personSelect = { id: true, name: true, email: true } satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;
