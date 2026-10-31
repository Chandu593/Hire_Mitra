# Hire Mitra

Hire Mitra is an applicant tracking system for recruiting teams managing multiple job openings. It replaces scattered spreadsheets and inboxes with a shared hiring pipeline, candidate histories, interviewer assignments and alerts for applications that need attention.

- **Live application:** https://hire-mitra-liart.vercel.app

> The backend runs on Render's free tier and may sleep when idle. The first request after inactivity may take a minute or longer. The demo is seeded with openings, candidates, interviewer assignments, feedback and stalled applications.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Recruiter | recruiter@example.com | Password123! |
| Interviewer | interviewer@example.com | Password123! |
| Interviewer | interviewer2@example.com | Password123! |

## What the application does

### Accounts and access

Users sign in with an email address and password. Recruiters manage openings and applications; interviewers see only applications assigned to them and can submit feedback. Authorization is enforced by the Express API using authentication middleware, role checks and application-level assignment checks, not just by hiding interface controls. Candidates are application records, not login accounts.

### Job openings and applications

Recruiters can create and edit job openings with a title, department, description and status. Openings can be archived and restored; archiving does not delete their applications. Each application belongs to one opening and stores a candidate's name, email, source and notes. Opening a job shows its applications.

The API supports creating and editing applications. Duplicate candidate emails are prevented within the same opening; the same person can apply to a different opening. The application-detail editing interface depends on whether the optional UI update has been applied to your copy.

### Hiring pipeline

Applications move through the following stages, one step at a time:

**Applied → Screening → Interview → Offer → Hired**

Recruiters can reject an application from any stage. Rejected applications remain in the system and can be reinstated to the exact stage they were rejected from. The server validates transitions and rejects invalid stage jumps.

### Interview panels and feedback

Recruiters can assign multiple interviewers to an application, and an interviewer can be assigned to applications across multiple openings. Only users with the interviewer role can be assigned. Each interviewer has a list of assigned applications and can view their details and add feedback to their timelines.

### Search, filters and bulk actions

A cross-opening application list supports server-side search by candidate name or email, filtering by opening, stage and source, sorting, and pagination with a total match count. Recruiters can select applications to bulk-advance or bulk-reject them. Bulk results report success or refusal for each candidate, including the reason for a refusal. Recruiters can also export a CSV snapshot of the pipeline.

### Dashboard and alerts

The recruiter dashboard provides headline numbers for openings, applications, interviews and hires; breakdowns by opening and stage; and a weekly applications chart for the last quarter.

**Metric limitation:** “Interviews this week” counts applications entering the Interview stage that week. It is not a count of scheduled interviews; there is no interview scheduling module.

Applications that remain in a stage for more than ten days appear in the stalled-alert area, with a navigation badge. Recruiters can dismiss an alert; if the application moves to a new stage and subsequently stalls, it can appear again.

### Application timeline

Each application has a history of its creation, stage changes, rejection and reinstatement, interviewer feedback and other recorded activity. Timeline events include the actor and time where applicable. The API exposes no timeline edit or delete routes, so the history is append-only through the application.

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, React Router and Lucide icons |
| Backend | Node.js, Express and Mongoose |
| Database | MongoDB Atlas |
| Authentication | JWT and bcryptjs |
| Hosting | Vercel frontend and Render backend, using free tiers |

The React client sends requests to the Express API. The API authenticates users, enforces role and pipeline rules, and reads and writes data in MongoDB.

## Run locally

### Prerequisites

- A recent Node.js and npm installation compatible with the versions in the project lockfiles.
- A MongoDB database, local or hosted on MongoDB Atlas.

### 1. Clone and install

```bash
git clone https://github.com/Chandu593/Hire_Mitra.git
cd Hire_Mitra
npm run install:all
```

### 2. Configure environment variables

Create `server/.env`:

```env
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:5173
PORT=5000
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Keep real connection strings and secrets out of Git. Use your own values rather than committing the examples above.

### 3. Seed demo data

```bash
npm run seed
```

**Warning:** The seed script resets existing application data in the database it connects to. Use it only with a database you are happy to reset; check `MONGODB_URI` first.

### 4. Start the app

Run these commands in separate terminals from the project root:

```bash
npm run dev:server
```

```bash
npm run dev:client
```

Open the local URL printed by Vite, normally http://localhost:5173. To build the frontend for production:

```bash
npm run build --prefix client
```

## Project structure

```text
client/                 React frontend
server/                 Express API, models, routes and seed script
docs/                   Architecture, schema, planning, decisions and AI-use notes
START_HERE.md           Additional setup instructions
SUBMISSION.md           Reviewer submission details
```

## Known limitations and future work

- Interview scheduling is not implemented; the dashboard uses the Interview-stage approximation described above.
- There is no public applicant portal or public registration flow for recruiters and interviewers. Demo accounts are provided by the seed script.
- Possible future work includes interview scheduling, structured scorecards, dashboard rollups and a public careers page.