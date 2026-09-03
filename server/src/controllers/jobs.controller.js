import JobOpening from '../models/JobOpening.js';
import Application from '../models/Application.js';

export async function listJobs(req, res) {
  const query = req.query.includeArchived === 'true' ? {} : { status: 'open' };
  const jobs = await JobOpening.find(query).sort({ createdAt: -1 }).lean();
  const counts = await Application.aggregate([{ $group: { _id: '$jobOpening', count: { $sum: 1 } } }]);
  const countMap = new Map(counts.map(c => [c._id.toString(), c.count]));
  res.json(jobs.map(job => ({ ...job, applicationCount: countMap.get(job._id.toString()) || 0 })));
}

export async function createJob(req, res) {
  const { title, department, description } = req.body;
  const job = await JobOpening.create({ title, department, description, createdBy: req.user._id });
  res.status(201).json(job);
}

export async function getJob(req, res) {
  const job = await JobOpening.findById(req.params.id);
  if (!job) return res.status(404).json({ message: 'Job opening not found.' });
  res.json(job);
}

export async function updateJob(req, res) {
  const allowed = (({ title, department, description }) => ({ title, department, description }))(req.body);
  const job = await JobOpening.findByIdAndUpdate(req.params.id, allowed, { new: true, runValidators: true });
  if (!job) return res.status(404).json({ message: 'Job opening not found.' });
  res.json(job);
}

export async function archiveJob(req, res) {
  const job = await JobOpening.findByIdAndUpdate(req.params.id, { status: 'archived' }, { new: true });
  if (!job) return res.status(404).json({ message: 'Job opening not found.' });
  res.json(job);
}

export async function restoreJob(req, res) {
  const job = await JobOpening.findByIdAndUpdate(req.params.id, { status: 'open' }, { new: true });
  if (!job) return res.status(404).json({ message: 'Job opening not found.' });
  res.json(job);
}
