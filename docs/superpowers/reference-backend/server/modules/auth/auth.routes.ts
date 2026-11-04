import { Router } from "express";
import { authenticate } from "../../http/auth-middleware";
import * as controller from "./auth.controller";

export const authRoutes = Router();

authRoutes.post("/register", controller.register);
authRoutes.post("/login", controller.login);
authRoutes.post("/logout", controller.logout);
authRoutes.get("/me", authenticate, controller.me);
