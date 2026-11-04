import { prisma } from "../../db";
import { personSelect, type PublicUser } from "../../lib/selects";
import { sendAssignmentEmail } from "../../lib/mailer";
import { badRequest, forbidden, notFound } from "../../http/errors";
import { assertCanView, isMember } from "../projects/projects.service";
import { buildTicketWhere, TICKET_ORDER } from "./tickets.query";
import { canAssignOrDeleteTicket, canCreateTicket, canEditTicket } from "@/shared/permissions";
import type { CreateTicketInput, TicketListQuery, UpdateTicketInput } from "@/shared/schemas";
import type { Prisma } from "../../generated/prisma/client";

const ticketInclude = {
  project: { select: { id: true, key: true, name: true } },
  assignee: { select: personSelect },
  reporter: { select: personSelect },
} satisfies Prisma.TicketInclude;

type TicketWithRelations = Prisma.TicketGetPayload<{ include: typeof ticketInclude }>;

async function assertAssignable(projectId: number, assigneeId: number): Promise<void> {
  if (!(await isMember(projectId, assigneeId))) {
    throw badRequest("Assignee must be a member of the project");
  }
}

async function notifyAssignee(ticket: TicketWithRelations, actor: PublicUser): Promise<void> {
  // Nobody needs an email about assigning a ticket to themselves.
  if (!ticket.assignee || ticket.assignee.id === actor.id) return;
  await sendAssignmentEmail({
    to: ticket.assignee.email,
    ticketKey: `${ticket.project.key}-${ticket.id}`,
    ticketId: ticket.id,
    ticketTitle: ticket.title,
    projectName: ticket.project.name,
    assignedByName: actor.name,
  });
}

export async function list(actor: PublicUser, query: TicketListQuery) {
  const where = buildTicketWhere(actor, query);
  const [items, total] = await prisma.$transaction([
    prisma.ticket.findMany({
      where,
      include: ticketInclude,
      orderBy: TICKET_ORDER[query.sort],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.ticket.count({ where }),
  ]);
  return { items, total };
}

export async function get(actor: PublicUser, id: number) {
  const ticket = await prisma.ticket.findUnique({ where: { id }, include: ticketInclude });
  if (!ticket) throw notFound("Ticket");
  await assertCanView(actor, ticket.projectId);
  return ticket;
}

export async function create(actor: PublicUser, input: CreateTicketInput) {
  const member = await assertCanView(actor, input.projectId);
  if (!canCreateTicket(actor, member)) throw forbidden();

  if (input.assigneeId !== null) {
    if (!canAssignOrDeleteTicket(actor, member)) throw forbidden();
    await assertAssignable(input.projectId, input.assigneeId);
  }

  const ticket = await prisma.ticket.create({
    data: { ...input, reporterId: actor.id },
    include: ticketInclude,
  });
  await notifyAssignee(ticket, actor);
  return ticket;
}

export async function update(actor: PublicUser, id: number, input: UpdateTicketInput) {
  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing) throw notFound("Ticket");

  const member = await assertCanView(actor, existing.projectId);
  if (!canEditTicket(actor, member, existing)) throw forbidden();

  const isReassigning = input.assigneeId !== undefined && input.assigneeId !== existing.assigneeId;
  if (isReassigning) {
    if (!canAssignOrDeleteTicket(actor, member)) throw forbidden();
    if (input.assigneeId) await assertAssignable(existing.projectId, input.assigneeId);
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data: input,
    include: ticketInclude,
  });
  if (isReassigning) await notifyAssignee(ticket, actor);
  return ticket;
}

export async function remove(actor: PublicUser, id: number) {
  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing) throw notFound("Ticket");

  const member = await assertCanView(actor, existing.projectId);
  if (!canAssignOrDeleteTicket(actor, member)) throw forbidden();

  await prisma.ticket.delete({ where: { id } });
}
