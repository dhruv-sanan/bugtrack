import { Router } from "express";
import * as controller from "./tickets.controller";

export const ticketsRoutes = Router();

ticketsRoutes.get("/", controller.list);
ticketsRoutes.post("/", controller.create);
ticketsRoutes.get("/:id", controller.get);
ticketsRoutes.patch("/:id", controller.update);
ticketsRoutes.delete("/:id", controller.remove);
