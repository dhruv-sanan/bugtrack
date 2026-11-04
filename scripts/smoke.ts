/**
 * End-to-end API check against a running app, local or deployed:
 *   npm run smoke -- http://localhost:3000
 * Needs seeded demo accounts. Creates its own data and removes it afterwards.
 */
const BASE_URL = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const DEMO_PASSWORD = "demo1234";

let failures = 0;

function check(name: string, passed: boolean, detail?: unknown) {
  if (passed) {
    console.log(`  ok    ${name}`);
  } else {
    failures += 1;
    console.error(`  FAIL  ${name}`, detail ?? "");
  }
}

interface ApiResult {
  status: number;
  // Responses are checked structurally by each assertion.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
  setCookie: string;
}

class Client {
  private cookie = "";

  async request(method: string, path: string, body?: unknown, rawBody?: string): Promise<ApiResult> {
    const response = await fetch(`${BASE_URL}/api${path}`, {
      method,
      headers: {
        ...(body !== undefined || rawBody !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
        ...(this.cookie ? { Cookie: this.cookie } : {}),
      },
      body: rawBody ?? (body === undefined ? undefined : JSON.stringify(body)),
    });
    const setCookie = response.headers.get("set-cookie") ?? "";
    if (setCookie) this.cookie = setCookie.split(";")[0];
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null, setCookie };
  }

  login(email: string, password = DEMO_PASSWORD) {
    return this.request("POST", "/auth/login", { email, password });
  }
}

async function main() {
  console.log(`Smoke testing ${BASE_URL}\n`);
  const suffix = Date.now().toString(36).toUpperCase();
  const anonymous = new Client();
  const admin = new Client();
  const manager = new Client();
  const developer = new Client();

  console.log("Platform");
  let res = await anonymous.request("GET", "/health");
  check("health check reaches the database", res.status === 200, res);
  res = await anonymous.request("GET", "/nope");
  check("unknown route returns 404 JSON", res.status === 404 && res.body.error.code === "NOT_FOUND", res);
  res = await anonymous.request("POST", "/auth/login", undefined, "{bad json");
  check("malformed JSON returns 400", res.status === 400 && res.body.error.code === "BAD_JSON", res);

  console.log("\nAuth");
  res = await anonymous.request("GET", "/tickets");
  check("tickets need authentication", res.status === 401, res);
  res = await anonymous.request("GET", "/auth/me");
  check("me needs authentication", res.status === 401, res);
  res = await anonymous.login("admin@example.com", "wrong-password");
  check("wrong password returns 401", res.status === 401, res);
  res = await anonymous.request("POST", "/auth/login", { email: "not-an-email", password: "x" });
  check("invalid login body returns 400", res.status === 400 && res.body.error.code === "VALIDATION_ERROR", res);

  res = await admin.login("admin@example.com");
  check("Admin can log in", res.status === 200 && res.body.data.role === "ADMIN", res);
  check("session cookie is httpOnly", /httponly/i.test(res.setCookie), res.setCookie);
  check("session cookie is SameSite=Lax", /samesite=lax/i.test(res.setCookie), res.setCookie);
  if (BASE_URL.startsWith("https://")) {
    check("session cookie is Secure over HTTPS", /secure/i.test(res.setCookie), res.setCookie);
  }
  check("login response has no password hash", !("passwordHash" in res.body.data), res.body);
  res = await admin.request("GET", "/auth/me");
  check("cookie authenticates the next request", res.status === 200 && res.body.data.email === "admin@example.com", res);

  res = await manager.login("manager@example.com");
  check("Manager can log in", res.status === 200, res);
  const managerId: number = res.body.data.id;
  res = await developer.login("developer@example.com");
  check("Developer can log in", res.status === 200, res);
  const developerId: number = res.body.data.id;

  const fresh = new Client();
  const freshEmail = `smoke.${suffix.toLowerCase()}@example.com`;
  res = await fresh.request("POST", "/auth/register", {
    name: "Smoke Tester",
    email: freshEmail,
    password: "password1",
    role: "ADMIN",
  });
  check("signup returns 201", res.status === 201, res);
  check("signup ignores a requested role", res.body.data?.role === "DEVELOPER", res.body);
  const freshId: number = res.body.data.id;
  res = await anonymous.request("POST", "/auth/register", {
    name: "Smoke Tester",
    email: freshEmail,
    password: "password1",
  });
  check("duplicate email returns 409", res.status === 409 && res.body.error.code === "CONFLICT", res);

  console.log("\nUsers");
  res = await developer.request("GET", "/users");
  check("Developer cannot list users", res.status === 403, res);
  res = await manager.request("GET", "/users?limit=2&page=1");
  check("Manager can list users, paginated", res.status === 200 && res.body.data.length === 2 && res.body.meta.total >= 4, res);
  check("user list has no password hash", !("passwordHash" in res.body.data[0]), res.body);
  res = await manager.request("POST", "/users", { name: "No", email: "no@example.com", password: "password1" });
  check("Manager cannot create users", res.status === 403, res);
  res = await developer.request("PATCH", `/users/${managerId}`, { name: "Hacked" });
  check("Developer cannot edit another user", res.status === 403, res);
  res = await fresh.request("PATCH", `/users/${freshId}`, { role: "ADMIN" });
  check("non-admin cannot grant themselves a role", res.status === 200 ? res.body.data.role === "DEVELOPER" : res.status === 400, res);
  res = await fresh.request("PATCH", `/users/${freshId}`, { name: "Smoke Renamed" });
  check("user can rename themselves", res.status === 200 && res.body.data.name === "Smoke Renamed", res);
  res = await admin.request("GET", "/auth/me");
  const adminId: number = res.body.data.id;
  res = await admin.request("PATCH", `/users/${adminId}`, { role: "DEVELOPER" });
  check("Admin cannot demote themselves", res.status === 400, res);
  res = await admin.request("DELETE", `/users/${adminId}`);
  check("Admin cannot delete themselves", res.status === 400, res);
  res = await admin.request("PATCH", `/users/${managerId}`, { role: "DEVELOPER" });
  check("Admin cannot change a demo account's role", res.status === 403, res);
  res = await admin.request("DELETE", `/users/${managerId}`);
  check("Admin cannot delete a demo account", res.status === 403, res);
  res = await manager.request("PATCH", `/users/${managerId}`, { password: "changed-pass-1" });
  check("demo user cannot change their password", res.status === 403, res);
  res = await manager.request("GET", "/tickets/99999999999");
  check("out-of-range id returns 400, not 500", res.status === 400, res);

  console.log("\nProjects");
  const key = `S${suffix}`.slice(0, 10);
  res = await developer.request("POST", "/projects", { name: "Nope", key: "NOPE" });
  check("Developer cannot create projects", res.status === 403, res);
  res = await manager.request("POST", "/projects", { name: "Smoke Project", key });
  check("Manager can create a project", res.status === 201 && res.body.data.key === key, res);
  check("creator joins as a member", res.body.data._count?.members === 1, res.body);
  const projectId: number = res.body.data.id;
  res = await manager.request("POST", "/projects", { name: "Duplicate", key });
  check("duplicate project key returns 409", res.status === 409, res);
  res = await developer.request("GET", `/projects/${projectId}`);
  check("non-member cannot view the project", res.status === 403, res);
  res = await admin.request("GET", `/projects/${projectId}`);
  check("Admin can view any project", res.status === 200, res);
  res = await manager.request("GET", "/projects/999999");
  check("missing project returns 404", res.status === 404, res);
  res = await manager.request("GET", "/projects/abc");
  check("non-numeric id returns 400", res.status === 400, res);
  res = await manager.request("POST", `/projects/${projectId}/members`, { userId: developerId });
  check("Manager can add a member", res.status === 201 && res.body.data.id === developerId, res);
  res = await manager.request("POST", `/projects/${projectId}/members`, { userId: developerId });
  check("adding a member twice returns 409", res.status === 409, res);
  res = await manager.request("POST", `/projects/${projectId}/members`, { userId: 999999 });
  check("adding an unknown user returns 400", res.status === 400, res);
  res = await developer.request("GET", `/projects/${projectId}/members`);
  check("member can list members", res.status === 200 && res.body.data.length === 2, res);
  res = await developer.request("PATCH", `/projects/${projectId}`, { name: "Hacked" });
  check("Developer cannot edit the project", res.status === 403, res);
  res = await manager.request("PATCH", `/projects/${projectId}`, { description: "Updated" });
  check("Manager can edit the project", res.status === 200 && res.body.data.description === "Updated", res);

  console.log("\nTickets");
  res = await developer.request("POST", "/tickets", { projectId, title: "x" });
  check("short title returns 400 with field details", res.status === 400 && Boolean(res.body.error.details?.fieldErrors?.title), res);
  res = await developer.request("POST", "/tickets", { projectId, title: "Developer ticket", assigneeId: managerId });
  check("Developer cannot assign on create", res.status === 403, res);
  res = await developer.request("POST", "/tickets", { projectId, title: "Developer ticket" });
  check("member can create a ticket", res.status === 201 && res.body.data.status === "TODO", res);
  check("reporter is the caller", res.body.data.reporter?.id === developerId, res.body);
  const ownTicketId: number = res.body.data.id;
  res = await manager.request("POST", "/tickets", {
    projectId,
    title: "Searchable UNIQUE-TITLE ticket",
    priority: "HIGH",
    assigneeId: managerId,
  });
  check("Manager can create and assign a ticket", res.status === 201 && res.body.data.assignee?.id === managerId, res);
  const managerTicketId: number = res.body.data.id;
  res = await manager.request("POST", "/tickets", { projectId, title: "Bad assignee", assigneeId: freshId });
  check("assignee must be a project member", res.status === 400, res);

  res = await developer.request("PATCH", `/tickets/${ownTicketId}`, { status: "IN_PROGRESS" });
  check("Developer can move a ticket they reported", res.status === 200 && res.body.data.status === "IN_PROGRESS", res);
  check("partial update keeps other fields", res.body.data.priority === "MEDIUM", res.body);
  res = await developer.request("PATCH", `/tickets/${managerTicketId}`, { status: "DONE" });
  check("Developer cannot edit someone else's ticket", res.status === 403, res);
  res = await developer.request("PATCH", `/tickets/${ownTicketId}`, { assigneeId: developerId });
  check("Developer cannot assign tickets", res.status === 403, res);
  res = await manager.request("PATCH", `/tickets/${ownTicketId}`, { assigneeId: developerId });
  check("Manager can reassign a ticket", res.status === 200 && res.body.data.assignee?.id === developerId, res);
  res = await manager.request("PATCH", `/tickets/${ownTicketId}`, {});
  check("empty update returns 400", res.status === 400, res);
  res = await fresh.request("GET", `/tickets/${ownTicketId}`);
  check("non-member cannot read the ticket", res.status === 403, res);

  res = await manager.request("GET", `/tickets?projectId=${projectId}&q=unique-title`);
  check("search matches case-insensitively", res.status === 200 && res.body.meta.total === 1, res);
  res = await manager.request("GET", `/tickets?projectId=${projectId}&priority=HIGH`);
  check("priority filter works", res.status === 200 && res.body.data.every((t: { priority: string }) => t.priority === "HIGH"), res);
  res = await manager.request("GET", `/tickets?projectId=${projectId}&status=IN_PROGRESS`);
  check("status filter works", res.status === 200 && res.body.meta.total === 1, res);
  res = await developer.request("GET", `/tickets?projectId=${projectId}&assigneeId=me`);
  check("assigned-to-me filter works", res.status === 200 && res.body.meta.total === 1 && res.body.data[0].id === ownTicketId, res);
  res = await manager.request("GET", `/tickets?projectId=${projectId}&sort=priority`);
  check("priority sort puts HIGH first", res.status === 200 && res.body.data[0].priority === "HIGH", res);
  res = await manager.request("GET", "/tickets?status=NOPE");
  check("invalid filter returns 400", res.status === 400, res);
  res = await fresh.request("GET", `/tickets?projectId=${projectId}`);
  check("list hides tickets from non-members", res.status === 200 && res.body.meta.total === 0, res);

  res = await developer.request("DELETE", `/tickets/${managerTicketId}`);
  check("Developer cannot delete tickets", res.status === 403, res);
  res = await manager.request("DELETE", `/tickets/${managerTicketId}`);
  check("Manager can delete a ticket", res.status === 204, res);
  res = await manager.request("GET", `/tickets/${managerTicketId}`);
  check("deleted ticket returns 404", res.status === 404, res);

  console.log("\nCleanup rules");
  res = await manager.request("DELETE", `/projects/${projectId}/members/${developerId}`);
  check("Manager can remove a member", res.status === 204, res);
  res = await manager.request("GET", `/tickets/${ownTicketId}`);
  check("removing a member unassigns their tickets", res.body.data?.assignee === null, res);
  check("removed member stays as reporter", res.body.data?.reporter?.id === developerId, res.body);
  res = await developer.request("GET", `/tickets/${ownTicketId}`);
  check("removed member loses access", res.status === 403, res);

  res = await admin.request("POST", `/projects/${projectId}/members`, { userId: freshId });
  res = await fresh.request("POST", "/tickets", { projectId, title: "Reported by soon-deleted user" });
  const orphanId: number = res.body.data.id;
  res = await admin.request("DELETE", `/users/${freshId}`);
  check("Admin can delete a user", res.status === 204, res);
  res = await fresh.request("GET", "/auth/me");
  check("deleted user's session stops working", res.status === 401, res);
  res = await manager.request("GET", `/tickets/${orphanId}`);
  check("deleted user's tickets stay, with no reporter", res.status === 200 && res.body.data.reporter === null, res);

  res = await manager.request("DELETE", `/projects/${projectId}`);
  check("Manager can delete a project", res.status === 204, res);
  res = await manager.request("GET", `/tickets/${ownTicketId}`);
  check("deleting a project removes its tickets", res.status === 404, res);

  console.log("\nLogout");
  res = await developer.request("POST", "/auth/logout");
  check("logout returns 204", res.status === 204, res);
  check("logout clears the cookie", /token=;/.test(res.setCookie), res.setCookie);

  console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll checks passed");
  process.exitCode = failures ? 1 : 0;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
