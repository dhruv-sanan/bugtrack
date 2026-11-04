# BugTrack

A mini Jira: projects, tickets, a Kanban board, role-based access and assignment emails. Built for the Detroit Software Consultants Associate Developer assignment.

**Live app: https://bugtrack-dun.vercel.app**

## Demo accounts

The login page has a one-click button for each account. The password for all of them is `demo1234`.

| Name | Email | Role |
|---|---|---|
| Asha Admin | `admin@example.com` | Admin |
| Manav Manager | `manager@example.com` | Manager |
| Divya Developer | `developer@example.com` | Developer |
| Rohan Developer | `rohan@example.com` | Developer |

Demo accounts cannot be edited or deleted, so the logins keep working for every reviewer. To try editing a profile, sign up for your own account. The demo password is public, so keep real data out of the app.

## Features

- Sign up, log in and log out, with a JWT in an `httpOnly` cookie
- Projects with members, and tickets with priority, status and assignee
- A Kanban board with drag and drop by mouse, touch or keyboard, plus a status dropdown on every card
- Filters, search and sorting kept in the URL, so a filtered view can be shared
- User management for Admins, and a profile dialog for everyone
- An email to the assignee when a ticket is assigned
- A responsive layout, down to 360 px wide

## Permissions

The rules live in `shared/permissions.ts`. The API enforces them, and the UI uses the same functions to hide actions a user cannot take.

| Action | Admin | Manager | Developer |
|---|---|---|---|
| Manage users and roles | Yes | No | No |
| Edit own name and password | Yes | Yes | Yes |
| Change a user's email | Yes | No | No |
| Create project | Yes | Yes, and joins it | No |
| Edit or delete project, manage members | Yes | Member projects | No |
| View project and tickets | All | Member projects | Member projects |
| Create ticket | Yes | Member projects | Member projects |
| Edit ticket, move status | Yes | Member projects | Tickets assigned to or reported by them |
| Assign or delete ticket | Yes | Member projects | No |

## Architecture

One Next.js app on Vercel serves both the UI and the API, so there is one origin, one deploy and no CORS.

- **Frontend:** Next.js App Router, TypeScript, Redux Toolkit with RTK Query, Tailwind, shadcn/ui and dnd-kit.
- **API:** Express in `server/`, layered as routes, controllers and services, and mounted by `pages/api/[...path].ts`.
- **Database:** Neon Postgres through Prisma. Migrations are in `prisma/migrations`.
- **Shared code:** `shared/` holds the zod schemas, permissions and constants used on both sides. Client code never imports from `server/`, because that would pull in Prisma.

```
app/          Pages and layouts
components/   UI components, with shadcn/ui primitives in components/ui
lib/          RTK Query API, store, hooks and helpers
server/       Express app, one module per resource
shared/       Schemas, permissions and constants
prisma/       Schema, migrations and seed data
scripts/      End-to-end API smoke test
tests/        Unit tests
```

## API

All routes are under `/api`. Responses are `{ data }`, and paginated lists add `meta: { page, limit, total }`. Errors are `{ error: { code, message, details? } }`.

| Method and path | Purpose |
|---|---|
| `POST /auth/register`, `/auth/login`, `/auth/logout` | Sign up, log in, log out |
| `GET /auth/me` | The current user |
| `GET`, `POST /users` | List users, or create one (Admin) |
| `GET`, `PATCH`, `DELETE /users/:id` | Read, edit or delete a user |
| `GET`, `POST /projects` | List or create projects |
| `GET`, `PATCH`, `DELETE /projects/:id` | Read, edit or delete a project |
| `GET`, `POST /projects/:id/members` | List or add members |
| `DELETE /projects/:id/members/:userId` | Remove a member |
| `GET`, `POST /tickets` | List or create tickets |
| `GET`, `PATCH`, `DELETE /tickets/:id` | Read, edit or delete a ticket |
| `GET /health` | Checks the app and the database |

`GET /tickets` accepts `projectId`, `status`, `priority`, `assigneeId` (an ID, `me` or `none`), `q`, `sort` (`updated`, `newest` or `priority`), `page` and `limit`.

Status codes used: 200, 201, 204, 400, 401, 403, 404, 409, 413 and 500.

## Run it locally

You need Node.js 22 or later and a Postgres database. A free [Neon](https://neon.tech) database works.

```bash
npm install
cp .env.example .env     # then fill in DATABASE_URL, DIRECT_URL and JWT_SECRET
npm run db:deploy        # create the tables
npm run db:seed          # add demo data. This deletes all existing data
npm run dev              # http://localhost:3000
```

`.env.example` explains each variable. Generate `JWT_SECRET` with `openssl rand -base64 48`.

## Tests

```bash
npm test                     # unit tests
npm run typecheck
npm run lint
npm run smoke -- <app-url>   # end-to-end API checks. Needs seeded data
```

The smoke test creates its own data and removes it afterwards.

## Try the assignment email

**Email delivery has not been tested yet.** The live app has no SMTP credentials, so it skips sending and logs a warning. Only the code that builds the email has tests.

To try it:

1. Set `SMTP_USER`, `SMTP_PASS` and `MAIL_FROM` in `.env`, or in Vercel followed by a redeploy. For Gmail, turn on 2-Step Verification and create an App Password for `SMTP_PASS`.
2. Sign up with a real address. Addresses at `@example.com` never get email.
3. Log in as Asha Admin, and add the new user to a project under its Settings.
4. Assign a ticket in that project to the new user. The email should arrive within a few seconds.

A failed send is logged and does not fail the ticket update.

## Known limits

- Cards in a board column sort by priority and then last updated. There is no manual ordering.
- `BUG-12` uses the global ticket ID, so numbers in a project can skip.
- There is no login rate limiting, because in-memory limiters are unreliable on serverless.
- Signup does not verify email addresses.
