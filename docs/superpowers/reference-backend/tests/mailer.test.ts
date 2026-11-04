import { describe, expect, it } from "vitest";
import { buildAssignmentEmail } from "@/server/lib/mailer";

const email = {
  to: "dev@gmail.com",
  ticketKey: "BUG-12",
  ticketId: 12,
  ticketTitle: "Broken login",
  projectName: "Customer Portal",
  assignedByName: "Asha",
};

describe("buildAssignmentEmail", () => {
  it("links to the ticket", () => {
    const { subject, text } = buildAssignmentEmail(email, "https://app.test");
    expect(subject).toBe("[BUG-12] Assigned to you: Broken login");
    expect(text).toContain("https://app.test/tickets/12");
  });

  it("escapes user-supplied text in the HTML body", () => {
    const { html } = buildAssignmentEmail(
      { ...email, ticketTitle: '<img src=x onerror="alert(1)">' },
      "https://app.test",
    );
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});
