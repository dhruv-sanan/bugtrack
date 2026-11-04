import type { Role, TicketPriority, TicketStatus } from "@/shared/constants";

/** API response shapes. Dates are ISO strings because they arrive as JSON. */
export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export type Person = Pick<User, "id" | "name" | "email">;

export interface Project {
  id: number;
  name: string;
  key: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  _count: { tickets: number; members: number };
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  projectId: number;
  assigneeId: number | null;
  reporterId: number | null;
  createdAt: string;
  updatedAt: string;
  project: Pick<Project, "id" | "key" | "name">;
  assignee: Person | null;
  reporter: Person | null;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}

export const ticketKey = (ticket: Pick<Ticket, "id" | "project">) =>
  `${ticket.project.key}-${ticket.id}`;
