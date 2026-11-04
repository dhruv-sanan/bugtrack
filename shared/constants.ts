export const ROLES = ["ADMIN", "MANAGER", "DEVELOPER"] as const;
export const TICKET_STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const;
export const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export const TICKET_SORTS = ["updated", "newest", "priority"] as const;

/** Postgres `integer` upper bound. A larger ID would make Prisma throw instead of finding nothing. */
export const MAX_ID = 2147483647;

/**
 * These accounts have a public password, so anyone could otherwise lock reviewers
 * out of the one-click demo logins by changing or deleting them.
 */
export const DEMO_EMAILS: readonly string[] = [
  "admin@example.com",
  "manager@example.com",
  "developer@example.com",
  "rohan@example.com",
];

export const isDemoAccount = (email: string) => DEMO_EMAILS.includes(email);

export type Role = (typeof ROLES)[number];
export type TicketStatus = (typeof TICKET_STATUSES)[number];
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];
export type TicketSort = (typeof TICKET_SORTS)[number];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  DEVELOPER: "Developer",
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  IN_REVIEW: "In review",
  DONE: "Done",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const SORT_LABELS: Record<TicketSort, string> = {
  updated: "Recently updated",
  newest: "Newest",
  priority: "Priority",
};
