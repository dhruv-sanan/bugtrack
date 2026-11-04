import type { Request, RequestHandler } from "express";
import { prisma } from "../db";
import { AUTH_COOKIE, verifyToken } from "../lib/token";
import { publicUserSelect, type PublicUser } from "../lib/selects";
import type { Actor } from "@/shared/permissions";
import { forbidden, unauthorized } from "./errors";

declare module "express-serve-static-core" {
  interface Request {
    user?: PublicUser;
  }
}

// Loading the user on every request means role changes and deletions apply
// immediately, rather than when the JWT expires.
export const authenticate: RequestHandler = async (req, _res, next) => {
  const userId = verifyToken(req.cookies?.[AUTH_COOKIE]);
  if (!userId) throw unauthorized();

  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
  if (!user) throw unauthorized();

  req.user = user;
  next();
};

export const requirePermission =
  (isAllowed: (actor: Actor) => boolean): RequestHandler =>
  (req, _res, next) => {
    if (!isAllowed(currentUser(req))) throw forbidden();
    next();
  };

export function currentUser(req: Request): PublicUser {
  if (!req.user) throw unauthorized();
  return req.user;
}
