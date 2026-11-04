import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../server/db";
import type { TicketPriority, TicketStatus } from "../shared/constants";

const DEMO_PASSWORD = "demo1234";

const USERS = [
  { key: "admin", name: "Asha Admin", email: "admin@example.com", role: "ADMIN" },
  { key: "manager", name: "Manav Manager", email: "manager@example.com", role: "MANAGER" },
  { key: "dev", name: "Divya Developer", email: "developer@example.com", role: "DEVELOPER" },
  { key: "dev2", name: "Rohan Developer", email: "rohan@example.com", role: "DEVELOPER" },
] as const;

type UserKey = (typeof USERS)[number]["key"];

interface SeedTicket {
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee: UserKey | null;
  reporter: UserKey;
}

const PROJECTS: {
  name: string;
  key: string;
  description: string;
  members: UserKey[];
  tickets: SeedTicket[];
}[] = [
  {
    name: "Customer Portal",
    key: "BUG",
    description: "Self-service web portal where customers manage their accounts.",
    members: ["manager", "dev", "dev2"],
    tickets: [
      {
        title: "Login fails when the email contains a plus sign",
        description: "Addresses like name+test@gmail.com get 'invalid email' on the login form.",
        status: "TODO",
        priority: "HIGH",
        assignee: "dev",
        reporter: "manager",
      },
      {
        title: "Invoice PDF shows the wrong currency symbol",
        description: "Invoices for INR accounts are rendered with a dollar sign.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        assignee: "dev2",
        reporter: "manager",
      },
      {
        title: "Profile photo upload silently fails above 5 MB",
        description: "No error is shown. The spinner stops and the old photo stays.",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        assignee: "dev",
        reporter: "dev2",
      },
      {
        title: "Dashboard chart overlaps the sidebar on tablets",
        description: "Reproducible at widths between 768px and 900px.",
        status: "IN_REVIEW",
        priority: "MEDIUM",
        assignee: "dev2",
        reporter: "dev",
      },
      {
        title: "Password reset email lands in spam",
        description: "Reported by several Outlook users. Check SPF and DKIM records.",
        status: "TODO",
        priority: "MEDIUM",
        assignee: null,
        reporter: "manager",
      },
      {
        title: "Footer links open in the same tab",
        description: "Legal links should open in a new tab so users keep their place.",
        status: "DONE",
        priority: "LOW",
        assignee: "dev",
        reporter: "dev",
      },
      {
        title: "Typo on the billing settings page",
        description: "'Recieve invoices by email' should read 'Receive invoices by email'.",
        status: "DONE",
        priority: "LOW",
        assignee: "dev2",
        reporter: "manager",
      },
    ],
  },
  {
    name: "Payments API",
    key: "PAY",
    description: "Internal service that processes refunds and card payments.",
    members: ["manager", "dev"],
    tickets: [
      {
        title: "Refund webhook is delivered twice on retry",
        description: "Retries reuse a new idempotency key, so refunds can be processed twice.",
        status: "IN_REVIEW",
        priority: "HIGH",
        assignee: "dev",
        reporter: "manager",
      },
      {
        title: "Timeout on the settlement report endpoint",
        description: "Reports covering more than 30 days exceed the 30 second gateway limit.",
        status: "TODO",
        priority: "MEDIUM",
        assignee: "dev",
        reporter: "manager",
      },
      {
        title: "Add request IDs to error logs",
        description: "Failed payments cannot currently be traced across services.",
        status: "TODO",
        priority: "LOW",
        assignee: null,
        reporter: "dev",
      },
    ],
  },
];

async function main() {
  console.warn("Seeding deletes ALL existing users, projects and tickets.");
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const ids = {} as Record<UserKey, number>;
  for (const { key, ...user } of USERS) {
    const created = await prisma.user.create({ data: { ...user, passwordHash } });
    ids[key] = created.id;
  }

  for (const { members, tickets, ...project } of PROJECTS) {
    await prisma.project.create({
      data: {
        ...project,
        members: { create: members.map((member) => ({ userId: ids[member] })) },
        tickets: {
          create: tickets.map(({ assignee, reporter, ...ticket }) => ({
            ...ticket,
            assigneeId: assignee && ids[assignee],
            reporterId: ids[reporter],
          })),
        },
      },
    });
  }
  console.log(`Seeded ${USERS.length} users and ${PROJECTS.length} projects.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
