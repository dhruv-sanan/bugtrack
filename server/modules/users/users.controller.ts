import type { RequestHandler } from "express";
import { canManageUsers } from "@/shared/permissions";
import {
  createUserSchema,
  idParam,
  updateSelfSchema,
  updateUserSchema,
  userListQuery,
} from "@/shared/schemas";
import { currentUser } from "../../http/auth-middleware";
import { forbidden } from "../../http/errors";
import * as usersService from "./users.service";

export const list: RequestHandler = async (req, res) => {
  const query = userListQuery.parse(req.query);
  const { items, total } = await usersService.list(query);
  res.json({ data: items, meta: { page: query.page, limit: query.limit, total } });
};

export const get: RequestHandler = async (req, res) => {
  res.json({ data: await usersService.get(idParam.parse(req.params.id)) });
};

export const create: RequestHandler = async (req, res) => {
  const user = await usersService.create(createUserSchema.parse(req.body));
  res.status(201).json({ data: user });
};

export const update: RequestHandler = async (req, res) => {
  const actor = currentUser(req);
  const id = idParam.parse(req.params.id);
  // Non-admins may edit only themselves, and only the fields in updateSelfSchema.
  if (!canManageUsers(actor) && id !== actor.id) throw forbidden();
  const schema = canManageUsers(actor) ? updateUserSchema : updateSelfSchema;
  res.json({ data: await usersService.update(actor, id, schema.parse(req.body)) });
};

export const remove: RequestHandler = async (req, res) => {
  await usersService.remove(currentUser(req), idParam.parse(req.params.id));
  res.status(204).end();
};
