import type { CookieOptions } from "express";
import jwt from "jsonwebtoken";
import { env } from "../env";

export const AUTH_COOKIE = "token";

const SESSION_SECONDS = 60 * 60 * 24 * 7;

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

export const sessionCookieOptions: CookieOptions = {
  ...authCookieOptions,
  maxAge: SESSION_SECONDS * 1000,
};

export function signToken(userId: number): string {
  return jwt.sign({}, env().JWT_SECRET, {
    subject: String(userId),
    expiresIn: SESSION_SECONDS,
    algorithm: "HS256",
  });
}

/** Returns the user id, or null for a missing, expired or forged token. */
export function verifyToken(token: unknown): number | null {
  if (typeof token !== "string") return null;
  try {
    const { sub } = jwt.verify(token, env().JWT_SECRET, { algorithms: ["HS256"] });
    const userId = Number(sub);
    return Number.isInteger(userId) ? userId : null;
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) return null;
    throw err;
  }
}
