import type { RequestHandler } from "express";
import {
  createTicketSchema,
  idParam,
  ticketListQuery,
  updateTicketSchema,
} from "@/shared/schemas";
import { currentUser } from "../../http/auth-middleware";
import * as ticketsService from "./tickets.service";

export const list: RequestHandler = async (req, res) => {
  const query = ticketListQuery.parse(req.query);
  const { items, total } = await ticketsService.list(currentUser(req), query);
  res.json({ data: items, meta: { page: query.page, limit: query.limit, total } });
};

export const get: RequestHandler = async (req, res) => {
  res.json({ data: await ticketsService.get(currentUser(req), idParam.parse(req.params.id)) });
};

export const create: RequestHandler = async (req, res) => {
  const ticket = await ticketsService.create(currentUser(req), createTicketSchema.parse(req.body));
  res.status(201).json({ data: ticket });
};

export const update: RequestHandler = async (req, res) => {
  const ticket = await ticketsService.update(
    currentUser(req),
    idParam.parse(req.params.id),
    updateTicketSchema.parse(req.body),
  );
  res.json({ data: ticket });
};

export const remove: RequestHandler = async (req, res) => {
  await ticketsService.remove(currentUser(req), idParam.parse(req.params.id));
  res.status(204).end();
};
