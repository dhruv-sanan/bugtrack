# BugTrack (Mini Jira): Design

Assignment for Detroit Software Consultants (Associate Developer).
**Deadline: 2026-11-05, 11:00.** Delivery speed is the priority.

Scored on code quality, working features, UI/UX, REST API design, and bonus extras such as RBAC.

## Status

| Item | State |
|---|---|
| Design decisions | Done (below) |
| Backend code | Written and verified locally, moved to the repo root |
| Frontend code | Done, and tested in a real browser. See "Verified" |
| Implementation plan | Done, in `plans/2026-11-04-bugtrack.md` |
| Fable review | Done, fixes applied |
| Vercel and Neon | Deployed to https://bugtrack-dun.vercel.app from https://github.com/dhruv-sanan/bugtrack, where each push to `main` goes to production. See "Verified" |
| Real email delivery | Not tested, because no SMTP credentials were supplied. See "Not verified" |

## Decisions

- **Scope:** all required features, plus RBAC, email notifications and a Kanban board.
- **Stack:** Next.js App Router, TypeScript, Redux Toolkit with RTK Query, Express, Prisma, Neon Postgres, Tailwind, shadcn/ui, dnd-kit.
- **Deployment:** one Vercel project. Express lives in `server/` and is mounted by `pages/api/[...path].ts`, so there is one origin, one deploy, one dev command and no CORS.
- **ORM:** Prisma rather than raw SQL, for speed. The JD requires SQL, so commit the generated migration SQL and be ready to write the ticket-list query as a SQL `JOIN` in an interview.
- **Auth:** JWT in an `httpOnly`, `Secure`, `SameSite=Lax` cookie, with bcrypt. The user is loaded from the DB on each request, so role changes apply immediately.
- **Signup:** open, always creates a Developer, so a reviewer can register with a real email and receive a notification.
- **Email:** Nodemailer with Gmail SMTP. `sendMail` is awaited because Vercel may stop the function after the response. Failure is logged and never fails the request. `@example.com` addresses skip sending.

**Cut for speed:** manual card order within a board column (cards sort by priority, then last updated), per-project ticket numbers (`BUG-12` uses the global ID, so numbers can skip), login rate limiting (in-memory limiters are unreliable on serverless), and SSR data fetching (pages are login-gated, so there is no SEO need).

## Data

Source of truth: `prisma/schema.prisma`. Tables are `User`, `Project`, `ProjectMember`, `Ticket`. Deleting a user sets ticket reporter and assignee to null, and the UI shows "Deleted user". Deleting a project cascades to its members and tickets.

## Permissions

Source of truth: `shared/permissions.ts`, used by the API to enforce and by the UI to hide actions.

| Action | Admin | Manager | Developer |
|---|---|---|---|
| Manage users and roles | Yes | No | No |
| Create project | Yes | Yes (auto-joins) | No |
| Edit/delete project, manage members | Yes | Member projects | No |
| View project and tickets | All | Member projects | Member projects |
| Create ticket | Yes | Member projects | Member projects |
| Edit ticket, move status | Yes | Member projects | Tickets assigned to or reported by them |
| Assign or delete ticket | Yes | Member projects | No |

Any ticket or project a non-admin can see is in a project they belong to, so the client can pass `isMember: true` to these functions.

## API

Implemented in `server/`, layered as routes, controllers, services.

- `POST /api/auth/register`, `/login`, `/logout`, `GET /api/auth/me` (only `me` needs auth, so an expired session can still log out)
- `GET`, `POST /api/users`, `GET`, `PATCH`, `DELETE /api/users/:id`
- `GET`, `POST /api/projects`, `GET`, `PATCH`, `DELETE /api/projects/:id`
- `GET`, `POST /api/projects/:id/members`, `DELETE /api/projects/:id/members/:userId`
- `GET`, `POST /api/tickets`, `GET`, `PATCH`, `DELETE /api/tickets/:id`
- `GET /api/tickets?projectId=&status=&priority=&assigneeId=(id|me|none)&q=&sort=(updated|newest|priority)&page=&limit=`
- `GET /api/health` also checks the database

Responses are `{ data }`. Paginated lists add `meta: { page, limit, total }`; the members list is not paginated. Errors are `{ error: { code, message, details? } }`. Status codes used: 200, 201, 204, 400, 401, 403, 404, 409, 413, 500.

## Frontend

| Route | Purpose |
|---|---|
| `/login`, `/register` | Auth. Login has one-click demo buttons per role |
| `/tickets` | All visible tickets, "assigned to me" filter, search, pagination |
| `/projects` | Project list and create |
| `/projects/[id]` | Board and list views with a shared filter bar |
| `/projects/[id]/settings` | Edit project, manage members |
| `/tickets/[id]` | Ticket detail and edit |
| `/users` | User admin, Admin only |

- **Reusable components:** `TicketForm` (create and edit), `TicketCard`, `FilterBar`, `PriorityBadge`, `StatusBadge`, `UserSelect`, `ConfirmDialog`, `EmptyState`.
- **State:** RTK Query holds server data and the current user. A small `uiSlice` holds view mode. Filters live in the URL, so links and refresh keep them. Debounce search by 300 ms.
- **Board:** drag changes status only. Use `useDraggable`/`useDroppable` from `@dnd-kit/core`, with a grip handle (`touch-none`) so touch scrolling still works. Update optimistically and roll back with a toast on failure. Load up to 200 tickets per project.
- **Mobile:** board columns scroll sideways, and every card also has a status dropdown. Tables become card lists on small screens.
- **Route guard:** client-side check in the app layout for UX. The API does the real enforcement. On a 401, reset RTK Query state so the guard redirects to login.
- **Next.js:** components calling `useSearchParams` must sit inside `<Suspense>`, or `next build` fails.

## Testing

- `npm test`: Vitest on permissions, schemas, the ticket query builder and the email builder.
- `npm run smoke -- <url>`: end-to-end API check against a running app, local or deployed. Needs seeded data.
- Last run: 36 unit tests pass, `tsc` and ESLint clean, and 84 of 84 smoke checks pass against the deployed app on Neon.

## Traps found by running it

1. **Prisma version:** `npm i prisma` installs `8.0.0-rc.30`. Pin `prisma@7.10.1`, `@prisma/client@7.10.1` and `@prisma/adapter-pg@7.10.1`.
2. **Folder name:** `create-next-app .` refuses this folder because of its capital letters. Scaffold in a subfolder and move up.
3. **CSS import:** after shadcn init, `next build` fails with `Can't resolve 'tw-animate-css'`. In `app/globals.css`, use `@import "../node_modules/tw-animate-css/dist/tw-animate.css";`.
4. **TypeScript:** latest is 7.x. Pin `typescript@5.9.3`, which Prisma recommends.
5. **`req.query` under Next.js:** it contains the catch-all `path` param, and repeated params become arrays. The zod schemas strip the former and reject the latter.
6. **Prisma generate:** v7 does not run it during `migrate dev`. Run `npx prisma generate` after migrating.
7. **Seed wipes data:** `npm run db:seed` deletes all users, projects and tickets. Demo password is `demo1234`.
8. **Harmless log:** `pg` prints a `client.query()` deprecation warning during Prisma `$transaction` calls. All checks still pass.

## Verified

- **API on Vercel and Neon:** the smoke test passes against the deployed app, which covers the Express mount in a Vercel function and `adapter-pg` over the pooled URL with SSL.
- **Browser, using Playwright with installed Chrome:** login for all roles, logout, route guard, `next` param, signup, drag by mouse, touch and keyboard, status dropdown, ticket, project, member and user management, profile and user editing, demo locks, filters in the URL, and developer gating.
- **Layout:** cards stay on one line at 1440, 1366 and 1280 px. At 360 px: no sideways overflow, plus the menu sheet, navigation, logout, status dropdown and dialogs.

## Not verified

- Real email delivery. The SMTP path has never run, because no credentials were supplied. Only the email builder is tested. The README explains how to try it.
- Browsers other than Chrome, and touch on a physical device. Touch drag was tested through emulated touch events.

## Security notes

- Demo accounts have a public password, so the demo Admin is open to anyone with the URL. Keep no real data in the app.
- Signup does not verify addresses, so anyone can register any address and have the demo Admin or Manager email it, with attacker-written text in the subject and no rate limit. Use a throwaway Gmail account, and revoke its App Password after evaluation.
- Demo accounts cannot have their name, password, email or role changed, and cannot be deleted, so the one-click logins keep working and reviewers see the names the demo buttons promise (`shared/constants.ts`, `users.service.ts`). The name lock is enforced in the API, not just the UI, because the password is public.
- Never commit `.env`. `.env.example` holds placeholders only.
