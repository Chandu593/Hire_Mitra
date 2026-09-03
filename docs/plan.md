# Plan

## Original estimate

I budgeted roughly 12 hours and split the work into foundation, core hiring workflow, reporting, alerts, deployment and documentation.

## Sessions

### Session 1 — Setup, schema and auth
- **Estimated:** 2 hours
- **Actual:** 2.5 - 3 hours
- **Built:** Project structure, environment template, user model, login, JWT authentication, role middleware.
- **Why first:** Almost every requirement depends on knowing who the user is and enforcing what they can do on the server.

### Session 2 — Jobs and applications
- **Estimated:** 2 hours
- **Actual:** 2 hours
- **Built:** Job openings, archive/restore, application creation/editing under a single job opening.

### Session 3 — Pipeline rules and timeline
- **Estimated:** 2 hours
- **Actual:** 1.5 hours
- **Built:** Advance/reject/reinstate rules and timeline events.
- **Why this order:** Bulk actions later reuse the same pipeline service instead of duplicating transition rules.

### Session 4 — Interview panels and feedback
- **Estimated:** 2 hours
- **Actual:** 2 hours
- **Built:** Interviewer assignment, interviewer-only assigned list, feedback as timeline events.

### Session 5 — Search, filters, pagination and bulk actions
- **Estimated:** 2 hours
- **Actual:** 1 hour
- **Built:** Server-side application listing, bulk advance/reject, CSV export.

### Session 6 — Dashboard, stalled alerts, seed data and docs
- **Estimated:** 2–3 hours
- **Actual:** 2 hours
- **Built:** Dashboard metrics, stalled alerts, demo seed data, documentation and submission notes.

## Build order and reasoning

I built authentication and server-side role checks first because the assignment specifically says recruiter/interviewer differences must be enforced by the server. I then built jobs and applications before pipeline logic, because the pipeline actions need persisted applications to operate on.

Pipeline transitions were placed in a central service before bulk actions so single and bulk operations share the same rules. Timeline events were added alongside state changes because history needs to be complete and immutable from the beginning.

## What changed

I considered a separate interview scheduling model, but kept the dashboard metric simpler: “interviews scheduled this week” is represented by applications that entered the Interview stage this week. Full interview scheduling was not otherwise required by the ten goals.

## What I cut

I did not build stretch features such as public careers page, candidate portal, resume upload, email notifications, scorecards or calendar scheduling. I prioritized the ten required goals.
