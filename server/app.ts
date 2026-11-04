import cookieParser from "cookie-parser";
import express, { Router } from "express";
import { prisma } from "./db";
import { authenticate } from "./http/auth-middleware";
import { errorHandler, notFoundHandler } from "./http/error-handler";
import { authRoutes } from "./modules/auth/auth.routes";
import { projectsRoutes } from "./modules/projects/projects.routes";
import { ticketsRoutes } from "./modules/tickets/tickets.routes";
import { usersRoutes } from "./modules/users/users.routes";

const api = Router();

api.get("/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ data: { status: "ok" } });
});

api.use("/auth", authRoutes);
api.use("/users", authenticate, usersRoutes);
api.use("/projects", authenticate, projectsRoutes);
api.use("/tickets", authenticate, ticketsRoutes);

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use("/api", api);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
