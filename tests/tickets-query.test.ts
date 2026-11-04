import { describe, expect, it } from "vitest";
import { buildTicketWhere } from "@/server/modules/tickets/tickets.query";
import type { Actor } from "@/shared/permissions";
import { ticketListQuery } from "@/shared/schemas";

const admin: Actor = { id: 1, role: "ADMIN" };
const developer: Actor = { id: 3, role: "DEVELOPER" };
const query = (input: Record<string, string> = {}) => ticketListQuery.parse(input);

describe("buildTicketWhere", () => {
  it("does not scope Admins to their memberships", () => {
    expect(buildTicketWhere(admin, query())).toEqual({});
  });

  it("scopes everyone else to projects they belong to", () => {
    expect(buildTicketWhere(developer, query())).toEqual({
      project: { members: { some: { userId: developer.id } } },
    });
  });

  it("keeps the scope when other filters are applied", () => {
    const where = buildTicketWhere(developer, query({ status: "DONE", priority: "HIGH" }));
    expect(where.project).toEqual({ members: { some: { userId: developer.id } } });
    expect(where.status).toBe("DONE");
    expect(where.priority).toBe("HIGH");
  });

  it("resolves the assignee filters", () => {
    expect(buildTicketWhere(admin, query({ assigneeId: "me" })).assigneeId).toBe(admin.id);
    expect(buildTicketWhere(admin, query({ assigneeId: "none" })).assigneeId).toBeNull();
    expect(buildTicketWhere(admin, query({ assigneeId: "9" })).assigneeId).toBe(9);
  });

  it("searches title and description, ignoring case", () => {
    expect(buildTicketWhere(admin, query({ q: "login" })).OR).toEqual([
      { title: { contains: "login", mode: "insensitive" } },
      { description: { contains: "login", mode: "insensitive" } },
    ]);
  });

  it("also matches a ticket key or bare ticket number", () => {
    expect(buildTicketWhere(admin, query({ q: "bug-12" })).OR).toContainEqual({
      id: 12,
      project: { key: "BUG" },
    });
    expect(buildTicketWhere(admin, query({ q: "12" })).OR).toContainEqual({ id: 12 });
  });

  it("does not match a number too large to be a ticket id", () => {
    expect(buildTicketWhere(admin, query({ q: "99999999999" })).OR).toHaveLength(2);
  });
});
