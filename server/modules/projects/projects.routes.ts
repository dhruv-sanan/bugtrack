import { Router } from "express";
import { canCreateProject } from "@/shared/permissions";
import { requirePermission } from "../../http/auth-middleware";
import * as controller from "./projects.controller";

export const projectsRoutes = Router();

projectsRoutes.get("/", controller.list);
projectsRoutes.post("/", requirePermission(canCreateProject), controller.create);
projectsRoutes.get("/:id", controller.get);
projectsRoutes.patch("/:id", controller.update);
projectsRoutes.delete("/:id", controller.remove);

projectsRoutes.get("/:id/members", controller.listMembers);
projectsRoutes.post("/:id/members", controller.addMember);
projectsRoutes.delete("/:id/members/:userId", controller.removeMember);
