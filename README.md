# Lead Manager

A small full-stack web app for sales users to capture and track leads, with login and a manager view.
Built for the Meru Technosoft Full Stack Developer screening assignment.

**Live demo:** https://lead-manager-eight-iota.vercel.app/

> The demo runs on free hosting. The API goes to sleep when idle, so the first request can take about a minute.
> The free server also forgets its database when it restarts, so accounts and leads can disappear. Just sign up again.
> To try the manager view, sign up with the manager email configured on the server.

## Features

**Core**
- Add a lead (name, email, phone, company, source, status)
- List all leads in a table with colored status badges
- Edit a lead and update its status
- Delete a lead, with a confirmation popup
- Search by name, email or company, and filter by status
- Input validation on both the frontend and the backend

**Bonus (all done)**
- Signup / login. Each sales user sees only their own leads; a manager sees everyone's leads, with an Owner column
- Sorting (click a column title) and pagination (10 per page)
- Dashboard counts: total leads and leads per status
- 14 automated API tests
- Deployed: frontend on Vercel, API on Render

## Tech stack and why

| Part | Choice | Why |
|---|---|---|
| Frontend | React + Vite | Matches the stack the team uses; Vite is fast to set up |
| Backend | Node.js + Express | Simple, widely used, easy to structure into small files |
| Database | SQLite (better-sqlite3) | Zero setup, a single file, enough for this scope |
| Auth | bcryptjs + JWT | Passwords are hashed; a signed token proves who is logged in |
| Tests | Vitest + Supertest | Fast, and can call the API without starting a server |

## Run it locally

You need Node.js (LTS) and npm.

**1. Start the backend**

```bash
cd backend
npm install
cp .env.example .env
```

On Windows Command Prompt, use `copy .env.example .env` instead of `cp`.
Open `backend/.env` and set your own values:

| Setting | Meaning |
|---|---|
| `PORT` | Port for the API (default 5000) |
| `JWT_SECRET` | A long random text used to sign login tokens. Keep it secret |
| `MANAGER_EMAILS` | Comma-separated emails that become managers when they sign up |

Then start it:

```bash
npm run dev
```

The API runs at http://localhost:5000. Check it at http://localhost:5000/api/health.

**2. Start the frontend** (in a second terminal)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173. `VITE_API_URL` in `frontend/.env` tells the frontend where the API is.

The database file (`backend/leads.db`) is created automatically on first run.

**3. Run the tests**

```bash
cd backend
npm test
```

The tests use an in-memory database, so your real data is never touched.

## Roles

- **Sales** (default for every signup): sees, edits and deletes only their own leads.
- **Manager**: sees and manages everyone's leads and sees an Owner column.
- The role cannot be chosen at signup. Only emails listed in `MANAGER_EMAILS` become managers.
- A lead always belongs to the user who created it.
- Trying to open someone else's lead returns "not found", the same as a lead that does not exist.

## API endpoints

| Method | Path | Auth | What it does |
|---|---|---|---|
| POST | `/api/auth/signup` | No | Create an account, returns a token |
| POST | `/api/auth/login` | No | Log in, returns a token |
| GET | `/api/auth/me` | Yes | Who is logged in |
| GET | `/api/leads` | Yes | List leads. Query: `search`, `status`, `sortBy`, `order`, `page`, `limit` |
| GET | `/api/leads/stats` | Yes | Total and per-status counts |
| GET | `/api/leads/:id` | Yes | Get one lead |
| POST | `/api/leads` | Yes | Create a lead |
| PUT | `/api/leads/:id` | Yes | Update a lead |
| DELETE | `/api/leads/:id` | Yes | Delete a lead |

Send the token as `Authorization: Bearer <token>`.
Status codes: `201` created, `204` deleted, `400` validation error, `401` not logged in, `404` not found, `409` email already registered, `500` server error.

## Project structure

```
backend/
  app.js              Express app (routes, error handling)
  index.js            Starts the server
  db.js               SQLite connection, schema and indexes
  src/
    validation.js     Lead input validation
    auth.js           Token creation and the login guard
    authRoutes.js     Signup, login, me
    userRepository.js Database queries for users
    leadRepository.js Database queries for leads (owner rules live here)
    leadRoutes.js     Lead REST routes
  tests/
    api.test.js       API tests
frontend/
  src/
    api.js            All calls to the backend, adds the login token
    constants.js      Shared status and source lists
    App.jsx           Chooses the login page or the dashboard
    Dashboard.jsx     Leads screen: state and data loading
    components/       Login page, form, table, search, stats, pagination, dialogs
```

## Database

SQLite, stored in `backend/leads.db` (created automatically on first run, not committed to Git).

Table `users`:

| Column | Type | Notes |
|---|---|---|
| id | INTEGER | Primary key |
| name | TEXT | Required |
| email | TEXT | Required, unique |
| password_hash | TEXT | bcrypt hash, never the real password |
| role | TEXT | `sales` or `manager` (limited by a `CHECK`) |
| created_at | TEXT | Set automatically |

Table `leads`:

| Column | Type | Notes |
|---|---|---|
| id | INTEGER | Primary key |
| user_id | INTEGER | Owner. Foreign key to `users(id)`, `ON DELETE CASCADE` |
| name, email, phone, company, source | TEXT | All required |
| status | TEXT | Default `New`, limited by a `CHECK` to New / Contacted / Qualified / Lost |
| created_at, updated_at | TEXT | Set automatically; `updated_at` changes on every edit |

Relationship: one user has many leads. Indexes: `leads.status` (status filter) and `leads.user_id` (every list is filtered by owner).

## Assumptions

- All lead fields are required. Phone accepts 7 to 15 digits, with optional `+`, spaces, dashes and brackets.
- Source options are fixed: Website, Referral, LinkedIn, Cold Call, Event, Other.
- Search matches name, email and company, case-insensitively.
- Passwords need at least 8 characters. A login lasts 7 days.

## Design decisions

- **Layers:** routes handle requests, `validation.js` checks input, the repository files are the only ones that touch the database. Each file stays small and easy to test.
- **Validation twice:** the frontend gives instant feedback; the backend is the real safety net and never trusts the client.
- **Access control in one place:** `leadRepository.js` applies the owner rule to every query, so a route cannot forget it.
- **SQL safety:** all queries use placeholders, and the sort column is checked against an allow-list.
- **Login safety:** passwords are hashed, the login error message is the same for a wrong email or a wrong password, and the manager role comes from server settings, not from the client.
- **Errors:** the API returns clear messages, and the frontend shows a friendly message with a Retry button if the server is down. An expired login sends the user back to the login page.

## What I cut, and what I would improve with more time

- A hosted database (for example Postgres) so deployed data survives restarts. The free host used here wipes SQLite files
- Forgot password / email reset (needs an email service)
- Storing the login token in an httpOnly cookie instead of localStorage
- Rate limiting on login to slow down password guessing
- Search uses `LIKE '%text%'`, which cannot use an index; full-text search would scale better
- Toast notifications for success messages, and a loading state when changing pages
- Frontend tests

## Something I found tricky
The trickiest part was after adding login: saving a lead suddenly failed with a vague "server error". I had to read the backend terminal to find the real cause, a database error saying leads need an owner, because one file still had the old code. I'm proud that sales users only see their own leads while managers see everyone's, and that I tested it with two accounts, 14 automated API tests, and a live deployment.