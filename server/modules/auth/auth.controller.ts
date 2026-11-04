import type { RequestHandler, Response } from "express";
import { loginSchema, registerSchema } from "@/shared/schemas";
import { currentUser } from "../../http/auth-middleware";
import { AUTH_COOKIE, authCookieOptions, sessionCookieOptions, signToken } from "../../lib/token";
import * as authService from "./auth.service";

const startSession = (res: Response, userId: number) =>
  res.cookie(AUTH_COOKIE, signToken(userId), sessionCookieOptions);

export const register: RequestHandler = async (req, res) => {
  const user = await authService.register(registerSchema.parse(req.body));
  startSession(res, user.id);
  res.status(201).json({ data: user });
};

export const login: RequestHandler = async (req, res) => {
  const user = await authService.login(loginSchema.parse(req.body));
  startSession(res, user.id);
  res.json({ data: user });
};

export const logout: RequestHandler = (_req, res) => {
  res.clearCookie(AUTH_COOKIE, authCookieOptions);
  res.status(204).end();
};

export const me: RequestHandler = (req, res) => {
  res.json({ data: currentUser(req) });
};
