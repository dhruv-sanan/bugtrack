import type { RequestHandler } from "express";
import {
  addMemberSchema,
  createProjectSchema,
  idParam,
  paginationQuery,
  updateProjectSchema,
} from "@/shared/schemas";
import { currentUser } from "../../http/auth-middleware";
import * as projectsService from "./projects.service";

export const list: RequestHandler = async (req, res) => {
  const query = paginationQuery.parse(req.query);
  const { items, total } = await projectsService.list(currentUser(req), query);
  res.json({ data: items, meta: { page: query.page, limit: query.limit, total } });
};

export const get: RequestHandler = async (req, res) => {
  res.json({ data: await projectsService.get(currentUser(req), idParam.parse(req.params.id)) });
};

export const create: RequestHandler = async (req, res) => {
  const project = await projectsService.create(
    currentUser(req),
    createProjectSchema.parse(req.body),
  );
  res.status(201).json({ data: project });
};

export const update: RequestHandler = async (req, res) => {
  const project = await projectsService.update(
    currentUser(req),
    idParam.parse(req.params.id),
    updateProjectSchema.parse(req.body),
  );
  res.json({ data: project });
};

export const remove: RequestHandler = async (req, res) => {
  await projectsService.remove(currentUser(req), idParam.parse(req.params.id));
  res.status(204).end();
};

export const listMembers: RequestHandler = async (req, res) => {
  const members = await projectsService.listMembers(
    currentUser(req),
    idParam.parse(req.params.id),
  );
  res.json({ data: members });
};

export const addMember: RequestHandler = async (req, res) => {
  const { userId } = addMemberSchema.parse(req.body);
  const member = await projectsService.addMember(
    currentUser(req),
    idParam.parse(req.params.id),
    userId,
  );
  res.status(201).json({ data: member });
};

export const removeMember: RequestHandler = async (req, res) => {
  await projectsService.removeMember(
    currentUser(req),
    idParam.parse(req.params.id),
    idParam.parse(req.params.userId),
  );
  res.status(204).end();
};
