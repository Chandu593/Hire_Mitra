# Architecture

## Moving pieces

- **React frontend:** Browser application for recruiters and interviewers.
- **Express API:** REST backend that owns authentication, role checks and business rules.
- **MongoDB Atlas:** Stores users, job openings, applications, timeline events and alert dismissals.
- **JWT authentication:** The frontend stores a JWT and sends it as a bearer token on API requests.

## How they talk to each other

The browser calls the API over HTTP using JSON. The API validates the JWT, loads the current user, checks role/assignment permissions, performs MongoDB operations through Mongoose, and returns JSON or CSV.

## Where each piece runs

- Frontend: Vercel free hosting.
- Backend: Render free service or Vercel serverless API, depending on final deployment.
- Database: MongoDB Atlas free cluster.
- Source code: Public GitHub repository.

## Representative request path: advancing an application

1. Recruiter opens an application detail page and clicks **Advance**.
2. React sends `PATCH /api/applications/:id/advance` with the JWT bearer token.
3. Express authenticates the token and loads the user.
4. The route requires the recruiter role.
5. The controller loads the application.
6. `pipeline.service.js` checks the current stage and computes the next legal stage.
7. If the move is valid, the application stage and `stageChangedAt` are updated.
8. A timeline event records the old stage, new stage and actor.
9. The API returns the updated application and message.
10. The frontend refreshes the application and timeline.

## Server-side authorization

Recruiters can manage the entire pipeline. Interviewers can only access applications where their user id appears in `assignedInterviewers`. This is enforced in backend queries and detail endpoints, not only in the UI.

## What was not built

- Candidate login role: candidates are application records, not system users.
- Full interview scheduling calendar: dashboard uses applications entering Interview stage this week.
- Email notifications and digests.
- Resume uploads/search.
- Public careers page and candidate status portal.

These were outside the required ten goals or stretch ideas, so they were left out to keep the 12-hour scope realistic.
