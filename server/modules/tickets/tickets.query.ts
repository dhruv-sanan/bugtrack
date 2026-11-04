import type { Actor } from "@/shared/permissions";
import type { TicketListQuery } from "@/shared/schemas";
import type { TicketSort } from "@/shared/constants";
import type { Prisma } from "../../generated/prisma/client";

/** Pure, so visibility scoping and filters can be unit tested without a database. */
export function buildTicketWhere(actor: Actor, query: TicketListQuery): Prisma.TicketWhereInput {
  const where: Prisma.TicketWhereInput = {};

  if (actor.role !== "ADMIN") where.project = { members: { some: { userId: actor.id } } };
  if (query.projectId) where.projectId = query.projectId;
  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;

  if (query.assigneeId === "me") where.assigneeId = actor.id;
  else if (query.assigneeId === "none") where.assigneeId = null;
  else if (query.assigneeId) where.assigneeId = query.assigneeId;

  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
    ];
  }
  return where;
}

export const TICKET_ORDER: Record<TicketSort, Prisma.TicketOrderByWithRelationInput[]> = {
  updated: [{ updatedAt: "desc" }],
  newest: [{ createdAt: "desc" }],
  priority: [{ priority: "desc" }, { updatedAt: "desc" }],
};
