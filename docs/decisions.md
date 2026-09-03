# Decisions

## Decision 1 — MERN stack

- **Chose:** React, Node.js, Express and MongoDB.
- **Rejected:** Supabase/Postgres or a Python backend.
- **Why:** I am fastest with JavaScript end to end, and the assignment prioritizes working business rules over a specific stack.

## Decision 2 — Candidates are application records, not users

- **Chose:** Only recruiters and interviewers are authenticated users. Candidates live as Application records.
- **Rejected:** A third candidate/applicant login role.
- **Why:** The brief requires internal users to sign in but does not require candidates to create accounts or submit applications themselves. Candidate-facing submission is closer to the optional careers-page stretch idea.

## Decision 3 — Server-side role enforcement

- **Chose:** Enforce recruiter/interviewer permissions in backend middleware and controller logic.
- **Rejected:** Only hiding recruiter actions in the React UI.
- **Why:** The brief explicitly says the role difference must be enforced on the server.

## Decision 4 — Central pipeline service

- **Chose:** Put advance, reject and reinstate rules in `pipeline.service.js`.
- **Rejected:** Duplicating stage checks in every controller and bulk action.
- **Why:** Single actions and bulk actions must reject illegal moves consistently.

## Decision 5 — Feedback as timeline events

- **Chose:** Store interviewer feedback as a type of TimelineEvent.
- **Rejected:** Separate editable feedback records.
- **Why:** The brief says feedback is part of the application timeline and cannot be edited or deleted after the fact.

## Decision 6 — Alert dismissal by application and stage

- **Chose:** Store `AlertDismissal` with application, stage and dismissedBy.
- **Rejected:** A simple `alertDismissed` boolean on Application.
- **Why:** A boolean would suppress future alerts forever, but the requirement says the alert must return if the application advances and stalls again.

## Decision 7 — Reversed decision: interview scheduling model

- **Chose initially:** A separate Interview collection with scheduled times.
- **Rejected later:** Full scheduling in this version.
- **Why initially:** It would model “interviews scheduled this week” more literally.
- **Later reversed:** Scheduling itself was not otherwise required. To stay inside the 12-hour scope, the dashboard counts applications that entered the Interview stage this week and documents that limitation.

## Decision 8: No public registration

- **Chose:** Hardcode recruiter or interviewer details for registration.
- **Rejected:** Public self-registration.
- **Why:** This is an internal hiring pipeline. Allowing anyone to register as a recruiter or interviewer would be unsafe. The brief requires sign-in and roles, not public signup.