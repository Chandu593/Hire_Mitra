import { ACTIVE_STAGES } from '../models/Application.js';
import { createTimelineEvent } from './timeline.service.js';

export function getNextStage(stage) {
  const index = ACTIVE_STAGES.indexOf(stage);
  if (index === -1 || index === ACTIVE_STAGES.length - 1) return null;
  return ACTIVE_STAGES[index + 1];
}

export async function advanceApplication(application, actorId) {
  if (application.stage === 'Rejected') {
    throw Object.assign(new Error('Rejected applications must be reinstated before they can advance.'), { status: 400 });
  }
  const nextStage = getNextStage(application.stage);
  if (!nextStage) {
    throw Object.assign(new Error('Application is already at the final stage and cannot advance further.'), { status: 400 });
  }
  const oldStage = application.stage;
  application.stage = nextStage;
  application.stageChangedAt = new Date();
  await application.save();
  await createTimelineEvent({ application: application._id, type: 'stage_change', actor: actorId, oldStage, newStage: nextStage, message: `Stage changed from ${oldStage} to ${nextStage}` });
  return { application, message: `Advanced from ${oldStage} to ${nextStage}` };
}

export async function moveApplicationToStage(application, targetStage, actorId) {
  const nextStage = getNextStage(application.stage);
  if (targetStage !== nextStage) {
    throw Object.assign(new Error(`Cannot move from ${application.stage} to ${targetStage}. Applications must advance one stage at a time.`), { status: 400 });
  }
  return advanceApplication(application, actorId);
}

export async function rejectApplication(application, actorId) {
  if (application.stage === 'Rejected') {
    throw Object.assign(new Error('Application is already rejected.'), { status: 400 });
  }
  const oldStage = application.stage;
  application.previousStageBeforeRejection = oldStage;
  application.stage = 'Rejected';
  application.rejectedAt = new Date();
  application.stageChangedAt = new Date();
  await application.save();
  await createTimelineEvent({ application: application._id, type: 'rejected', actor: actorId, oldStage, newStage: 'Rejected', message: `Application rejected from ${oldStage}` });
  return { application, message: `Rejected from ${oldStage}` };
}

export async function reinstateApplication(application, actorId) {
  if (application.stage !== 'Rejected') {
    throw Object.assign(new Error('Only rejected applications can be reinstated.'), { status: 400 });
  }
  if (!application.previousStageBeforeRejection) {
    throw Object.assign(new Error('Cannot reinstate because previous stage is unknown.'), { status: 400 });
  }
  const restoreStage = application.previousStageBeforeRejection;
  application.stage = restoreStage;
  application.previousStageBeforeRejection = null;
  application.rejectedAt = null;
  application.stageChangedAt = new Date();
  await application.save();
  await createTimelineEvent({ application: application._id, type: 'reinstated', actor: actorId, oldStage: 'Rejected', newStage: restoreStage, message: `Application reinstated to ${restoreStage}` });
  return { application, message: `Reinstated to ${restoreStage}` };
}
