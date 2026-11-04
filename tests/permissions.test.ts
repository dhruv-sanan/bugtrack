import { describe, expect, it } from "vitest";
import {
  canAssignOrDeleteTicket,
  canCreateProject,
  canCreateTicket,
  canEditTicket,
  canListUsers,
  canManageProject,
  canManageUsers,
  canViewProject,
  type Actor,
} from "@/shared/permissions";

const admin: Actor = { id: 1, role: "ADMIN" };
const manager: Actor = { id: 2, role: "MANAGER" };
const developer: Actor = { id: 3, role: "DEVELOPER" };

const ownedBy = (assigneeId: number | null, reporterId: number | null) => ({
  assigneeId,
  reporterId,
});

describe("user permissions", () => {
  it("lets only Admins manage users", () => {
    expect(canManageUsers(admin)).toBe(true);
    expect(canManageUsers(manager)).toBe(false);
    expect(canManageUsers(developer)).toBe(false);
  });

  it("lets Admins and Managers list users", () => {
    expect(canListUsers(admin)).toBe(true);
    expect(canListUsers(manager)).toBe(true);
    expect(canListUsers(developer)).toBe(false);
  });
});

describe("project permissions", () => {
  it("stops Developers creating projects", () => {
    expect(canCreateProject(admin)).toBe(true);
    expect(canCreateProject(manager)).toBe(true);
    expect(canCreateProject(developer)).toBe(false);
  });

  it("lets Admins view every project and others only their own", () => {
    expect(canViewProject(admin, false)).toBe(true);
    expect(canViewProject(manager, false)).toBe(false);
    expect(canViewProject(developer, true)).toBe(true);
  });

  it("lets Managers manage only projects they belong to", () => {
    expect(canManageProject(admin, false)).toBe(true);
    expect(canManageProject(manager, true)).toBe(true);
    expect(canManageProject(manager, false)).toBe(false);
    expect(canManageProject(developer, true)).toBe(false);
  });
});

describe("ticket permissions", () => {
  it("requires membership to create tickets, except for Admins", () => {
    expect(canCreateTicket(admin, false)).toBe(true);
    expect(canCreateTicket(developer, true)).toBe(true);
    expect(canCreateTicket(developer, false)).toBe(false);
  });

  it("lets Managers edit any ticket in their projects", () => {
    expect(canEditTicket(manager, true, ownedBy(null, null))).toBe(true);
    expect(canEditTicket(manager, false, ownedBy(null, null))).toBe(false);
  });

  it("lets Developers edit only tickets assigned to or reported by them", () => {
    expect(canEditTicket(developer, true, ownedBy(developer.id, null))).toBe(true);
    expect(canEditTicket(developer, true, ownedBy(null, developer.id))).toBe(true);
    expect(canEditTicket(developer, true, ownedBy(99, 98))).toBe(false);
  });

  it("removes edit rights when a Developer leaves the project", () => {
    expect(canEditTicket(developer, false, ownedBy(null, developer.id))).toBe(false);
  });

  it("stops Developers assigning or deleting tickets", () => {
    expect(canAssignOrDeleteTicket(admin, false)).toBe(true);
    expect(canAssignOrDeleteTicket(manager, true)).toBe(true);
    expect(canAssignOrDeleteTicket(developer, true)).toBe(false);
  });
});
