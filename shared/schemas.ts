import { z } from "zod";
import { ROLES, TICKET_PRIORITIES, TICKET_SORTS, TICKET_STATUSES } from "./constants";

const positiveId = z.number().int().positive();
const name = z.string().trim().min(2, "Name must be at least 2 characters").max(100);
const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email"));
// bcrypt ignores everything past 72 bytes, so longer passwords are rejected.
const password = z.string().min(8, "Password must be at least 8 characters").max(72);

const hasFields = (value: object) => Object.keys(value).length > 0;
const NO_FIELDS = "Provide at least one field to update";

export const idParam = z.coerce.number().int().positive();

export const registerSchema = z.object({ name, email, password });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

export const createUserSchema = registerSchema.extend({
  role: z.enum(ROLES).default("DEVELOPER"),
});

export const updateUserSchema = z
  .object({ name, email, password, role: z.enum(ROLES) })
  .partial()
  .refine(hasFields, NO_FIELDS);

export const updateSelfSchema = z.object({ name, password }).partial().refine(hasFields, NO_FIELDS);

const projectFields = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  key: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z][A-Z0-9]{1,9}$/, "Key must be 2-10 letters or digits, starting with a letter"),
  description: z.string().trim().max(2000),
});

export const createProjectSchema = projectFields.extend({
  description: projectFields.shape.description.default(""),
});

export const updateProjectSchema = projectFields.partial().refine(hasFields, NO_FIELDS);

export const addMemberSchema = z.object({ userId: positiveId });

// Defaults live on the create schema only: on PATCH, a default would silently
// overwrite fields the caller did not send.
const ticketFields = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().trim().max(5000),
  status: z.enum(TICKET_STATUSES),
  priority: z.enum(TICKET_PRIORITIES),
  assigneeId: positiveId.nullable(),
});

export const createTicketSchema = z.object({
  projectId: positiveId,
  title: ticketFields.shape.title,
  description: ticketFields.shape.description.default(""),
  status: ticketFields.shape.status.default("TODO"),
  priority: ticketFields.shape.priority.default("MEDIUM"),
  assigneeId: ticketFields.shape.assigneeId.default(null),
});

export const updateTicketSchema = ticketFields.partial().refine(hasFields, NO_FIELDS);

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
});

export const userListQuery = paginationQuery.extend({
  q: z.string().trim().max(100).optional(),
});

export const ticketListQuery = paginationQuery.extend({
  projectId: z.coerce.number().int().positive().optional(),
  status: z.enum(TICKET_STATUSES).optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  assigneeId: z
    .union([z.literal("me"), z.literal("none"), z.coerce.number().int().positive()])
    .optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(TICKET_SORTS).default("updated"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type PaginationQuery = z.infer<typeof paginationQuery>;
export type UserListQuery = z.infer<typeof userListQuery>;
export type TicketListQuery = z.infer<typeof ticketListQuery>;
