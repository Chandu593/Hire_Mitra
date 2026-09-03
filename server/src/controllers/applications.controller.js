import mongoose from 'mongoose';
import Application, { ALL_STAGES } from '../models/Application.js';
import JobOpening from '../models/JobOpening.js';
import User from '../models/User.js';
import TimelineEvent from '../models/TimelineEvent.js';
import { createTimelineEvent } from '../services/timeline.service.js';
import { advanceApplication, rejectApplication, reinstateApplication, moveApplicationToStage } from '../services/pipeline.service.js';
import { toCsv } from '../services/csv.service.js';

function canViewApplication(user, app) {
  if (user.role === 'recruiter') return true;
  return app.assignedInterviewers?.some(interviewer => {
    const interviewerId = interviewer?._id ? interviewer._id.toString() : interviewer.toString();
    return interviewerId === user._id.toString();
  });
}

async function populateApp(query) {
  return query.populate('jobOpening').populate('assignedInterviewers', 'name email role').populate('createdBy', 'name email role');
}

export async function listApplications(req, res) {
  const { search, jobOpening, stage, source, sortBy = 'updatedAt', sortOrder = 'desc' } = req.query;
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
  const query = {};

  if (req.user.role === 'interviewer') query.assignedInterviewers = req.user._id;
  if (search) {
    query.$or = [
      { candidateName: { $regex: search, $options: 'i' } },
      { candidateEmail: { $regex: search, $options: 'i' } }
    ];
  }
  if (jobOpening) query.jobOpening = jobOpening;
  if (stage) query.stage = stage;
  if (source) query.source = source;

  const allowedSort = ['appliedAt', 'stage', 'updatedAt'];
  const sortField = allowedSort.includes(sortBy) ? sortBy : 'updatedAt';
  const sort = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

  const [data, total] = await Promise.all([
    Application.find(query).populate('jobOpening', 'title department status').populate('assignedInterviewers', 'name email role').sort(sort).skip((page - 1) * limit).limit(limit),
    Application.countDocuments(query)
  ]);

  res.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } });
}

export async function listJobApplications(req, res) {
  const job = await JobOpening.findById(req.params.jobId);
  if (!job) return res.status(404).json({ message: 'Job opening not found.' });
  const applications = await Application.find({ jobOpening: req.params.jobId }).populate('assignedInterviewers', 'name email role').sort({ appliedAt: -1 });
  res.json(applications);
}

export async function createApplication(req, res) {
  const job = await JobOpening.findById(req.params.jobId);
  if (!job) return res.status(404).json({ message: 'Job opening not found.' });
  const { candidateName, candidateEmail, source, notes } = req.body;
  const now = new Date();
  const app = await Application.create({ jobOpening: job._id, candidateName, candidateEmail, source, notes: notes || '', stage: 'Applied', appliedAt: now, stageChangedAt: now, createdBy: req.user._id });
  await createTimelineEvent({ application: app._id, type: 'created', actor: req.user._id, newStage: 'Applied', message: 'Application created' });
  res.status(201).json(await Application.findById(app._id).populate('jobOpening').populate('assignedInterviewers', 'name email role'));
}

export async function getApplication(req, res) {
  const app = await populateApp(Application.findById(req.params.id));
  if (!app) return res.status(404).json({ message: 'Application not found.' });
  if (!canViewApplication(req.user, app)) return res.status(403).json({ message: 'You can only view applications assigned to you.' });
  res.json(app);
}

export async function updateApplication(req, res) {
  const allowed = (({ candidateName, candidateEmail, source, notes }) => ({ candidateName, candidateEmail, source, notes }))(req.body);
  const app = await Application.findByIdAndUpdate(req.params.id, allowed, { new: true, runValidators: true });
  if (!app) return res.status(404).json({ message: 'Application not found.' });
  await createTimelineEvent({ application: app._id, type: 'updated', actor: req.user._id, message: 'Application details updated' });
  res.json(await populateApp(Application.findById(app._id)));
}

export async function advance(req, res) {
  const app = await Application.findById(req.params.id);
  if (!app) return res.status(404).json({ message: 'Application not found.' });
  const result = req.body?.targetStage ? await moveApplicationToStage(app, req.body.targetStage, req.user._id) : await advanceApplication(app, req.user._id);
  res.json(result);
}

export async function reject(req, res) {
  const app = await Application.findById(req.params.id);
  if (!app) return res.status(404).json({ message: 'Application not found.' });
  res.json(await rejectApplication(app, req.user._id));
}

export async function reinstate(req, res) {
  const app = await Application.findById(req.params.id);
  if (!app) return res.status(404).json({ message: 'Application not found.' });
  res.json(await reinstateApplication(app, req.user._id));
}

export async function setInterviewers(req, res) {
  const { interviewerIds = [] } = req.body;
  const users = await User.find({ _id: { $in: interviewerIds } });
  if (users.length !== interviewerIds.length || users.some(u => u.role !== 'interviewer')) {
    return res.status(400).json({ message: 'Only users with interviewer role may be assigned to applications.' });
  }
  const app = await Application.findByIdAndUpdate(req.params.id, { assignedInterviewers: interviewerIds }, { new: true }).populate('assignedInterviewers', 'name email role').populate('jobOpening');
  if (!app) return res.status(404).json({ message: 'Application not found.' });
  await createTimelineEvent({ application: app._id, type: 'panel_updated', actor: req.user._id, message: `Interview panel updated (${users.map(u => u.name).join(', ') || 'none'})` });
  res.json(app);
}

export async function myApplications(req, res) {
  const apps = await Application.find({ assignedInterviewers: req.user._id }).populate('jobOpening', 'title department status').sort({ updatedAt: -1 });
  res.json(apps);
}

export async function getTimeline(req, res) {
  const app = await Application.findById(req.params.id);
  if (!app) return res.status(404).json({ message: 'Application not found.' });
  if (!canViewApplication(req.user, app)) return res.status(403).json({ message: 'You can only view timeline for applications assigned to you.' });
  const events = await TimelineEvent.find({ application: app._id }).populate('actor', 'name email role').sort({ createdAt: 1 });
  res.json(events);
}

export async function addFeedback(req, res) {
  const app = await Application.findById(req.params.id);
  if (!app) return res.status(404).json({ message: 'Application not found.' });
  if (!app.assignedInterviewers.some(id => id.toString() === req.user._id.toString())) {
    return res.status(403).json({ message: 'You can only leave feedback on applications assigned to you.' });
  }
  if (!req.body.feedbackText?.trim()) return res.status(400).json({ message: 'Feedback text is required.' });
  const event = await createTimelineEvent({ application: app._id, type: 'feedback', actor: req.user._id, message: 'Feedback added', feedbackText: req.body.feedbackText.trim() });
  res.status(201).json(await TimelineEvent.findById(event._id).populate('actor', 'name email role'));
}

async function bulk(ids, handler, actorId) {
  const results = [];
  for (const id of ids) {
    try {
      const app = await Application.findById(id);
      if (!app) {
        results.push({ applicationId: id, candidateName: '', status: 'failed', message: 'Application not found.' });
        continue;
      }
      const { message } = await handler(app, actorId);
      results.push({ applicationId: app._id, candidateName: app.candidateName, status: 'success', message });
    } catch (err) {
      const app = mongoose.Types.ObjectId.isValid(id) ? await Application.findById(id).catch(() => null) : null;
      results.push({ applicationId: id, candidateName: app?.candidateName || '', status: 'failed', message: err.message });
    }
  }
  return results;
}

export async function bulkAdvance(req, res) {
  const ids = req.body.applicationIds || [];
  res.json({ results: await bulk(ids, advanceApplication, req.user._id) });
}

export async function bulkReject(req, res) {
  const ids = req.body.applicationIds || [];
  res.json({ results: await bulk(ids, rejectApplication, req.user._id) });
}

export async function exportCsv(req, res) {
  const openJobs = await JobOpening.find({ status: 'open' }).select('_id');
  const rows = await Application.find({ jobOpening: { $in: openJobs.map(j => j._id) }, stage: { $nin: ['Rejected'] } })
    .populate('jobOpening', 'title department')
    .populate('assignedInterviewers', 'name email')
    .sort({ jobOpening: 1, stage: 1, candidateName: 1 })
    .lean();
  const csvRows = rows.map(app => ({
    candidateName: app.candidateName,
    candidateEmail: app.candidateEmail,
    jobOpening: app.jobOpening?.title || '',
    department: app.jobOpening?.department || '',
    source: app.source,
    stage: app.stage,
    appliedAt: new Date(app.appliedAt).toISOString(),
    updatedAt: new Date(app.updatedAt).toISOString(),
    assignedInterviewers: (app.assignedInterviewers || []).map(i => `${i.name} <${i.email}>`).join('; ')
  }));
  const csv = toCsv(csvRows, [
    { key: 'candidateName', label: 'Candidate Name' },
    { key: 'candidateEmail', label: 'Candidate Email' },
    { key: 'jobOpening', label: 'Job Opening' },
    { key: 'department', label: 'Department' },
    { key: 'source', label: 'Source' },
    { key: 'stage', label: 'Stage' },
    { key: 'appliedAt', label: 'Applied Date' },
    { key: 'updatedAt', label: 'Last Updated' },
    { key: 'assignedInterviewers', label: 'Assigned Interviewers' }
  ]);
  res.header('Content-Type', 'text/csv');
  res.attachment('Applications-snapshot.csv');
  res.send(csv);
}

export { ALL_STAGES };
