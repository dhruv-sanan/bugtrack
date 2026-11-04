import { Router } from "express";
import { canListUsers, canManageUsers } from "@/shared/permissions";
import { requirePermission } from "../../http/auth-middleware";
import * as controller from "./users.controller";

export const usersRoutes = Router();

usersRoutes.get("/", requirePermission(canListUsers), controller.list);
usersRoutes.post("/", requirePermission(canManageUsers), controller.create);
usersRoutes.get("/:id", requirePermission(canListUsers), controller.get);
usersRoutes.patch("/:id", controller.update);
usersRoutes.delete("/:id", requirePermission(canManageUsers), controller.remove);
