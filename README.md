# Lead Manager

A small full-stack web app for a sales user to capture and track leads.
Built for the Meru Technosoft Full Stack Developer screening assignment.

## Features

**Core**
- Add a lead (name, email, phone, company, source, status)
- List all leads in a table with colored status badges
- Edit a lead and update its status
- Delete a lead, with a confirmation popup
- Search by name, email or company, and filter by status
- Input validation on both the frontend and the backend

**Bonus (done)**
- Dashboard counts: total leads and leads per status
- Sorting (click a column title) and pagination (10 per page)

## Tech stack and why

| Part | Choice | Why |
|---|---|---|
| Frontend | React + Vite | Matches the stack the team uses; Vite is fast to set up |
| Backend | Node.js + Express | Simple, widely used, easy to structure into small files |
| Database | SQLite (better-sqlite3) | Zero setup, a single file, enough for this scope |

## Run it locally

You need Node.js (LTS) and npm.

**1. Start the backend**

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

On Windows Command Prompt, use `copy .env.example .env` instead of `cp`.
The API runs at http://localhost:5000. Check it at http://localhost:5000/api/health.

**2. Start the frontend** (in a second terminal)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173.

The database file (`backend/leads.db`) is created automatically on first run.

## API endpoints

| Method | Path | What it does |
|---|---|---|
| GET | `/api/leads` | List leads. Query: `search`, `status`, `sortBy`, `order`, `page`, `limit` |
| GET | `/api/leads/stats` | Total and per-status counts |
| GET | `/api/leads/:id` | Get one lead |
| POST | `/api/leads` | Create a lead |
| PUT | `/api/leads/:id` | Update a lead |
| DELETE | `/api/leads/:id` | Delete a lead |

Status codes: `201` created, `204` deleted, `400` validation error, `404` not found, `500` server error.

## Project structure

```
backend/
  index.js            Express app, error handling
  db.js               SQLite connection, schema and indexes
  src/
    validation.js     Input validation
    leadRepository.js All database queries
    leadRoutes.js     REST routes
frontend/
  src/
    api.js            All calls to the backend
    constants.js      Shared status and source lists
    App.jsx           Main page, state and data loading
    components/       Form, table, search, stats, pagination, dialogs
```

## Database

SQLite, stored in `backend/leads.db` (created automatically on first run, not committed to Git).

Table `leads`:

| Column | Type | Notes |
|---|---|---|
| id | INTEGER | Primary key, auto-increment |
| name, email, phone, company, source | TEXT | All required |
| status | TEXT | Required, default `New`, limited by a `CHECK` to New / Contacted / Qualified / Lost |
| created_at, updated_at | TEXT | Set automatically; `updated_at` changes on every edit |

Indexes: `status` (speeds up the status filter) and `name`.
There is only one table, so there are no relationships yet.

## Assumptions

- A single user; there is no login yet, so everyone sees all leads.
- All fields are required. Phone accepts 7 to 15 digits, with optional `+`, spaces, dashes and brackets.
- Source options are fixed: Website, Referral, LinkedIn, Cold Call, Event, Other.
- Search matches name, email and company, case-insensitively.

## Design decisions

- **Layers:** routes handle requests, `validation.js` checks input, `leadRepository.js` is the only file that touches the database. This keeps each file small and easy to test.
- **Validation twice:** the frontend gives instant feedback; the backend is the real safety net and never trusts the client.
- **SQL safety:** all queries use placeholders, and the sort column is checked against an allow-list.
- **Database:** a `CHECK` constraint limits status to the four allowed values, and indexes speed up filtering.
- **Errors:** the API returns clear messages, and the frontend shows a friendly message with a Retry button if the server is down.

## What I cut, and what I would improve with more time

- Signup/login so each user sees only their own leads (a `users` table and a `user_id` column on `leads`)
- Automated tests for the API
- A deployed live demo
- Search uses `LIKE '%text%'`, which cannot use the `name` index; full-text search would scale better
- Toast notifications for success messages, and a loading state when changing pages

