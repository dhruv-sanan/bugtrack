import bcrypt from "bcryptjs";
import { prisma } from "../../db";
import { publicUserSelect, type PublicUser } from "../../lib/selects";
import { unauthorized } from "../../http/errors";
import type { LoginInput, RegisterInput } from "@/shared/schemas";

const BCRYPT_ROUNDS = 10;

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_ROUNDS);

/** Public signup always creates a Developer. Only an Admin can grant other roles. */
export async function register(input: RegisterInput): Promise<PublicUser> {
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
    },
    select: publicUserSelect,
  });
}

export async function login(input: LoginInput): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const isValid = user && (await bcrypt.compare(input.password, user.passwordHash));
  // The same message for both failures, so emails cannot be enumerated.
  if (!isValid) throw unauthorized("Incorrect email or password");

  const { id, name, email, role, createdAt } = user;
  return { id, name, email, role, createdAt };
}
