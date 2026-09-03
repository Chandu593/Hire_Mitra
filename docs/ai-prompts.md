# AI prompts

## Assignment understanding and implementation plan

### Prompt

I asked AI to study the provided README and documentation templates and create an incremental MERN implementation plan that satisfies all ten assignment goals using only free hosting.

### What I got

The AI broke the work into phases: setup, auth, job openings, applications, pipeline rules, interview panels, feedback, search, bulk actions, dashboard, stalled alerts, seed data, deployment and documentation.

### What I corrected

I clarified that candidates should not be a third authenticated role. They are application records unless a public careers page stretch feature is added.

## Data model and business rules

### Prompt

I asked AI to design the collections needed for users, jobs, applications, timeline events and stalled alert dismissals.

### What I got

A schema using User, JobOpening, Application, TimelineEvent and AlertDismissal collections, with `previousStageBeforeRejection` and `stageChangedAt` on Application.

### What I corrected

I kept the model small and did not add a separate candidate user or full interview scheduling collection.

## Bad output / correction example

### Prompt

I asked AI for bulk action behavior.

### What I got

The first suggested direction risked treating the whole bulk operation as one success/failure.

### What I corrected

The brief requires per-candidate reporting, so bulk advance and reject process every selected application independently and return a result row for each candidate.
