# Northstar HR

A minimal, light-themed HR portal built with Next.js. Employees can track attendance, view salary slips, read HR announcements, request leave, request admin services (like cash advances), and follow their appraisal cycle. HR staff get the same views with management controls (approve/reject requests, post announcements, manage payroll, run appraisal cycles).

## Demo accounts

| Role     | Email                 | Password      |
|----------|------------------------|---------------|
| HR admin | hr@company.com         | hr123456      |
| Employee | employee@company.com   | employee123   |
| Employee | sara@company.com       | employee123   |

New accounts can also be created from the Sign up page (always created with employee access).

## Tech stack

- **Next.js 16** (App Router, single full-stack project — pages + API routes)
- **Tailwind CSS 4** for styling
- **lucide-react** for icons
- **bcryptjs** for password hashing, **jsonwebtoken** for session cookies (httpOnly JWT)
- **PostgreSQL** (AWS RDS) via the `postgres` client for data storage

## Data storage

Data is persisted in a real PostgreSQL database (`lib/db.js`). On first connection, the app automatically creates its schema (`users`, `attendance`, `salary_slips`, `announcements`, `leave_requests`, `service_requests`, `appraisals`) if it doesn't already exist, and seeds demo data if the `users` table is empty. No manual migration step is required — just point `DATABASE_URL` at a Postgres instance and start the app.

## Environment variables

Create a `.env.local` file (or set these in your hosting provider) with:

```
DATABASE_URL=postgres://<user>:<password>@<host>:5432/<database>
JWT_SECRET=some-random-string   # optional, a safe default is used otherwise
```

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`.

## Deploy

The app deploys cleanly to any Next.js host (Vercel, AWS Amplify Hosting, etc.) with zero build configuration — just make sure `DATABASE_URL` is set as an environment variable on the hosting platform.

This project is currently deployed on **AWS Amplify Hosting**, connected to this repository's `main` branch for continuous deployment, backed by an **AWS RDS PostgreSQL** instance.

## Project structure

```
app/
  login/, signup/            Auth pages
  dashboard/                 Authenticated app shell + feature pages
    attendance/, salary/, announcements/, leave/, services/, appraisal/
  api/                       Route handlers for auth + all mutations
lib/
  db.js                      Postgres data layer (schema + seed + queries)
  auth.js                    JWT session cookie helpers
components/                  Shared UI (sidebar, cards, forms, buttons)
```

## Features by role

**Employee**
- Clock in / clock out, view attendance history
- View salary slips
- Read HR announcements
- Request leave (annual/sick/casual/unpaid) and track approval status
- Request admin services (cash advance, equipment, letters, other)
- Submit self-rating and view manager feedback for appraisal cycles

**HR**
- View attendance across the whole team
- Add salary slips for any employee
- Post and delete announcements
- Approve / reject leave and service requests
- Start appraisal cycles, set manager ratings and feedback
