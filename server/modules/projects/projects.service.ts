import { prisma } from "../../db";
import { personSelect, type PublicUser } from "../../lib/selects";
import { forbidden, notFound } from "../../http/errors";
import { canManageProject, canViewProject } from "@/shared/permissions";
import type { CreateProjectInput, PaginationQuery, UpdateProjectInput } from "@/shared/schemas";
import type { Prisma } from "../../generated/prisma/client";

const withCounts = {
  _count: { select: { tickets: true, members: true } },
} satisfies Prisma.ProjectInclude;

export async function isMember(projectId: number, userId: number): Promise<boolean> {
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { userId: true },
  });
  return membership !== null;
}

/** Returns membership so callers need no second query for their own checks. */
export async function assertCanView(actor: PublicUser, projectId: number): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) throw notFound("Project");
  const member = await isMember(projectId, actor.id);
  if (!canViewProject(actor, member)) throw forbidden();
  return member;
}

async function assertCanManage(actor: PublicUser, projectId: number): Promise<void> {
  const member = await assertCanView(actor, projectId);
  if (!canManageProject(actor, member)) throw forbidden();
}

export async function list(actor: PublicUser, { page, limit }: PaginationQuery) {
  const where: Prisma.ProjectWhereInput =
    actor.role === "ADMIN" ? {} : { members: { some: { userId: actor.id } } };
  const [items, total] = await prisma.$transaction([
    prisma.project.findMany({
      where,
      include: withCounts,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.project.count({ where }),
  ]);
  return { items, total };
}

export async function get(actor: PublicUser, id: number) {
  await assertCanView(actor, id);
  return prisma.project.findUniqueOrThrow({ where: { id }, include: withCounts });
}

/** The creator joins automatically, so a Manager can use the project right away. */
export async function create(actor: PublicUser, input: CreateProjectInput) {
  return prisma.project.create({
    data: { ...input, members: { create: { userId: actor.id } } },
    include: withCounts,
  });
}

export async function update(actor: PublicUser, id: number, input: UpdateProjectInput) {
  await assertCanManage(actor, id);
  return prisma.project.update({ where: { id }, data: input, include: withCounts });
}

export async function remove(actor: PublicUser, id: number) {
  await assertCanManage(actor, id);
  await prisma.project.delete({ where: { id } });
}

export async function listMembers(actor: PublicUser, projectId: number) {
  await assertCanView(actor, projectId);
  const memberships = await prisma.projectMember.findMany({
    where: { projectId },
    select: { user: { select: personSelect } },
    orderBy: { user: { name: "asc" } },
  });
  return memberships.map((membership) => membership.user);
}

export async function addMember(actor: PublicUser, projectId: number, userId: number) {
  await assertCanManage(actor, projectId);
  const { user } = await prisma.projectMember.create({
    data: { projectId, userId },
    select: { user: { select: personSelect } },
  });
  return user;
}

/** Tickets cannot stay assigned to a non-member, so both changes commit together. */
export async function removeMember(actor: PublicUser, projectId: number, userId: number) {
  await assertCanManage(actor, projectId);
  await prisma.$transaction([
    prisma.ticket.updateMany({
      where: { projectId, assigneeId: userId },
      data: { assigneeId: null },
    }),
    prisma.projectMember.delete({ where: { projectId_userId: { projectId, userId } } }),
  ]);
}
