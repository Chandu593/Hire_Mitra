# Submission

## Links

- **GitHub repository:** <public repo URL>
- **Live application:** <deployed URL>

## Notes for the reviewer

This project uses free-tier hosting and MongoDB Atlas free tier. If the backend is deployed on a sleeping free service such as Render, the first request may take up to a minute. The database is seeded with demo users, job openings, applications across stages, interviewer assignments, feedback timeline events and stalled alerts.

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Recruiter | recruiter@example.com | Password123! |
| Interviewer | interviewer@example.com | Password123! |
| Interviewer | interviewer2@example.com | Password123! |

## Stack

| Layer | What you used | Why |
|-------|---------------|-----|
| Frontend | React + Vite | Fast SPA development and straightforward Vercel deployment |
| Backend | Node.js + Express | Clear REST API with server-side business rules and RBAC |
| Database | MongoDB Atlas + Mongoose | Free hosted MongoDB and quick schema modelling |
| Hosting | Vercel frontend, Render or Vercel backend | Free tiers and GitHub-based deployment |

## Goal checklist

| # | Goal | Status | Notes |
|---|------|--------|-------|
| 1 | Accounts and roles | Done | JWT login with recruiter/interviewer roles enforced by backend middleware and controller checks. |
| 2 | Job openings | Done | Recruiters can create, edit, archive and restore openings. Archived openings are hidden by default without deleting applications. |
| 3 | Applications inside openings | Done | Applications belong to exactly one job opening and include candidate name, email, source and notes. |
| 4 | Pipeline with rules | Done | Server enforces one-stage advance, rejection from any stage and reinstatement to the exact rejected-from stage. |
| 5 | Interview panel | Done | Multiple interviewers can be assigned; only interviewer-role users are assignable; interviewers see assigned applications only. |
| 6 | Finding candidates | Done | Server-side search, filters, sorting and pagination with total match count. |
| 7 | Bulk actions and CSV | Done | Bulk advance/reject returns per-candidate results; CSV export returns open pipeline snapshot. |
| 8 | Dashboard | Done / Partial | Required dashboard sections exist. “Interviews this week” is approximated by applications that entered Interview stage this week rather than a full scheduling calendar. |
| 9 | Immutable history | Done | Timeline records creation, updates, stage changes, rejection, reinstatement, panel changes, alert dismissal and feedback. No update/delete timeline routes exist. |
| 10 | Stalled alerts | Done | Alerts show applications stalled for more than 10 days; dismissals are stored per application and stage so alerts return after stage movement. |

## How much time did you actually spend?

11 to 12 hours

## What would you do next, with another 12 hours?

I will build a full interview scheduling module, add structured scorecards, improve dashboard rollups, add a public careers page as a stretch feature and the other optional stretch ideas.

## What are you least happy with in this codebase, and why?

- There's no specific page or portal for applicants to submit and review their applications.
- No registration option for recruiters, interviewers.
- The dashboard interview metric is simplified. In a production system I would model interview schedules separately instead of inferring this metric from applications entering Interview stage.
