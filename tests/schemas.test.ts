import { describe, expect, it } from "vitest";
import {
  createProjectSchema,
  createTicketSchema,
  idParam,
  registerSchema,
  ticketListQuery,
  updateTicketSchema,
} from "@/shared/schemas";

describe("idParam", () => {
  it("coerces numeric strings", () => {
    expect(idParam.parse("12")).toBe(12);
  });

  it("rejects values Postgres cannot store as an integer", () => {
    expect(idParam.safeParse("99999999999").success).toBe(false);
    expect(idParam.safeParse("abc").success).toBe(false);
    expect(idParam.safeParse("0").success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("normalises email before validating it", () => {
    const parsed = registerSchema.parse({
      name: "Asha",
      email: "  Asha+Test@Example.COM ",
      password: "password1",
    });
    expect(parsed.email).toBe("asha+test@example.com");
  });

  it("rejects short passwords and bad emails", () => {
    expect(
      registerSchema.safeParse({ name: "Asha", email: "a@b.co", password: "short" }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ name: "Asha", email: "nope", password: "password1" }).success,
    ).toBe(false);
  });
});

describe("createProjectSchema", () => {
  it("uppercases the key", () => {
    expect(createProjectSchema.parse({ name: "Portal", key: "bug" }).key).toBe("BUG");
  });

  it("rejects keys that would make unreadable ticket IDs", () => {
    expect(createProjectSchema.safeParse({ name: "Portal", key: "1BUG" }).success).toBe(false);
    expect(createProjectSchema.safeParse({ name: "Portal", key: "B" }).success).toBe(false);
  });
});

describe("ticket schemas", () => {
  it("applies defaults on create", () => {
    expect(createTicketSchema.parse({ projectId: 1, title: "Broken login" })).toEqual({
      projectId: 1,
      title: "Broken login",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      assigneeId: null,
    });
  });

  it("does not add defaults on update, so partial edits keep other fields", () => {
    expect(updateTicketSchema.parse({ status: "DONE" })).toEqual({ status: "DONE" });
  });

  it("rejects an empty update", () => {
    expect(updateTicketSchema.safeParse({}).success).toBe(false);
  });

  it("allows clearing the assignee", () => {
    expect(updateTicketSchema.parse({ assigneeId: null })).toEqual({ assigneeId: null });
  });
});

describe("ticketListQuery", () => {
  it("coerces query strings and applies defaults", () => {
    expect(ticketListQuery.parse({ projectId: "4", assigneeId: "7" })).toEqual({
      projectId: 4,
      assigneeId: 7,
      page: 1,
      limit: 20,
      sort: "updated",
    });
  });

  it("accepts the me and none assignee filters", () => {
    expect(ticketListQuery.parse({ assigneeId: "me" }).assigneeId).toBe("me");
    expect(ticketListQuery.parse({ assigneeId: "none" }).assigneeId).toBe("none");
  });

  it("strips the catch-all path param Next.js adds to req.query", () => {
    expect(ticketListQuery.parse({ path: ["tickets"] })).not.toHaveProperty("path");
  });

  it("rejects an invalid status and an oversized limit", () => {
    expect(ticketListQuery.safeParse({ status: "NOPE" }).success).toBe(false);
    expect(ticketListQuery.safeParse({ limit: "500" }).success).toBe(false);
  });
});
