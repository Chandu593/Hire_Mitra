# Schema

## User

- `_id`: ObjectId
- `name`: string, required
- `email`: string, required, unique, indexed, lowercase
- `passwordHash`: string, required
- `role`: enum `recruiter` / `interviewer`, required
- `createdAt`: Date
- `updatedAt`: Date

## JobOpening

- `_id`: ObjectId
- `title`: string, required
- `department`: string, required
- `description`: string, required
- `status`: enum `open` / `archived`, default `open`, indexed
- `createdBy`: ObjectId reference to User
- `createdAt`: Date
- `updatedAt`: Date

## Application

- `_id`: ObjectId
- `jobOpening`: ObjectId reference to JobOpening, required, indexed
- `candidateName`: string, required, indexed
- `candidateEmail`: string, required, lowercase, indexed
- `source`: string, required, indexed
- `notes`: string
- `stage`: enum `Applied`, `Screening`, `Interview`, `Offer`, `Hired`, `Rejected`, indexed
- `previousStageBeforeRejection`: string/null
- `rejectedAt`: Date/null
- `stageChangedAt`: Date, indexed
- `assignedInterviewers`: array of User ObjectIds
- `appliedAt`: Date, indexed
- `createdBy`: ObjectId reference to User
- `createdAt`: Date
- `updatedAt`: Date

## TimelineEvent

- `_id`: ObjectId
- `application`: ObjectId reference to Application, indexed
- `type`: enum `created`, `updated`, `stage_change`, `rejected`, `reinstated`, `feedback`, `panel_updated`, `alert_dismissed`
- `actor`: ObjectId reference to User
- `oldStage`: string/null
- `newStage`: string/null
- `message`: string
- `feedbackText`: string/null
- `createdAt`: Date

Timeline events do not expose update or delete routes, making them append-only from the API.

## AlertDismissal

- `_id`: ObjectId
- `application`: ObjectId reference to Application, indexed
- `stage`: string, indexed
- `dismissedBy`: ObjectId reference to User
- `dismissedAt`: Date

Unique index: application + stage + dismissedBy.

## Relationships

- One user can create many job openings.
- One job opening has many applications.
- One application has many timeline events.
- Users and applications have a many-to-many relationship for interview panels: one application can have many interviewers, and one interviewer can be assigned to many applications.
- One application can have multiple alert dismissals over time, each tied to a specific stage.

## Database-enforced constraints

- Unique user email.
- Required fields via Mongoose schemas.
- Enum constraints for roles, job status and stages.
- ObjectId references for relationships.

## Application-enforced constraints

- Stage transitions are validated in `pipeline.service.js`.
- Skipped stages are rejected by the server.
- Reinstatement uses `previousStageBeforeRejection`.
- Only users with interviewer role can be assigned to panels.
- Interviewers can only see assigned applications.
- Search, filtering, sorting and pagination happen in MongoDB queries.

## Deliberate denormalisation

- `stageChangedAt` is stored on Application so stalled-alert queries do not have to inspect timeline events.
- `previousStageBeforeRejection` is stored on Application so reinstatement does not need to infer previous state from timeline history.
- `assignedInterviewers` is stored directly on Application as an ObjectId array to keep the many-to-many panel simple for this project size.

## What would break first at 100x data

Regex search over candidate name/email would become slow. I would add stronger text indexes or a dedicated search service. Dashboard aggregations and alert scans would also need cached rollups or scheduled background jobs at much higher scale.
