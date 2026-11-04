import type { Role } from "./constants";

/**
 * Single source of truth for who can do what. The API enforces these rules;
 * the UI uses the same functions only to hide actions a user cannot take.
 */
export interface Actor {
  id: number;
  role: Role;
}

interface TicketOwnership {
  assigneeId: number | null;
  reporterId: number | null;
}

const isAdmin = (actor: Actor) => actor.role === "ADMIN";

export const canManageUsers = (actor: Actor) => isAdmin(actor);

export const canListUsers = (actor: Actor) => actor.role !== "DEVELOPER";

export const canCreateProject = (actor: Actor) => actor.role !== "DEVELOPER";

export const canViewProject = (actor: Actor, isMember: boolean) => isAdmin(actor) || isMember;

export const canManageProject = (actor: Actor, isMember: boolean) =>
  isAdmin(actor) || (actor.role === "MANAGER" && isMember);

export const canCreateTicket = canViewProject;

export const canAssignOrDeleteTicket = canManageProject;

export const canEditTicket = (actor: Actor, isMember: boolean, ticket: TicketOwnership) =>
  canManageProject(actor, isMember) ||
  (isMember && (ticket.assigneeId === actor.id || ticket.reporterId === actor.id));
