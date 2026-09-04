import Application from '../models/Application.js';
import AlertDismissal from '../models/AlertDismissal.js';
import { createTimelineEvent } from '../services/timeline.service.js';

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

export async function getStalledAlerts(req, res) {
  const threshold = new Date(Date.now() - TEN_DAYS_MS);
  const apps = await Application.find({ stage: { $nin: ['Rejected', 'Hired'] }, stageChangedAt: { $lt: threshold } })
    .populate('jobOpening', 'title department status')
    .sort({ stageChangedAt: 1 });
  const dismissals = await AlertDismissal.find({ application: { $in: apps.map(a => a._id) } }).lean();
  const dismissed = new Set(dismissals.map(d => `${d.application.toString()}:${d.stage}`));
  const alerts = apps
    .filter(app => app.jobOpening?.status !== 'archived')
    .filter(app => !dismissed.has(`${app._id.toString()}:${app.stage}`))
    .map(app => ({
      application: app,
      daysStalled: Math.floor((Date.now() - new Date(app.stageChangedAt).getTime()) / (24 * 60 * 60 * 1000))
    }));
  res.json({ count: alerts.length, alerts });
}

export async function dismissAlert(req, res) {
  const app = await Application.findById(req.params.applicationId);
  if (!app) return res.status(404).json({ message: 'Application not found.' });
  const dismissal = await AlertDismissal.findOneAndUpdate(
    { application: app._id, stage: app.stage, dismissedBy: req.user._id },
    { dismissedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  await createTimelineEvent({ application: app._id, type: 'alert_dismissed', actor: req.user._id, message: `Stalled alert dismissed for ${app.stage} stage` });
  res.json({ message: 'Alert dismissed.', dismissal });
}
