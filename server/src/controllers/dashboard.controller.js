import Application from '../models/Application.js';
import JobOpening from '../models/JobOpening.js';

function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff); d.setHours(0,0,0,0); return d;
}
function startOfMonth(date = new Date()) { const d = new Date(date); d.setDate(1); d.setHours(0,0,0,0); return d; }
function addDays(date, days) { const d = new Date(date); d.setDate(d.getDate() + days); return d; }
function weekKey(date) { return date.toISOString().slice(0,10); }

export async function getDashboard(req, res) {
  const openJobs = await JobOpening.find({ status: 'open' }).select('_id title department').lean();
  const openJobIds = openJobs.map(j => j._id);
  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const quarterStart = addDays(now, -7 * 12);

  const [openPositions, activeApplications, interviewsThisWeek, hiresThisMonth, byStage, byJob, receivedRaw] = await Promise.all([
    JobOpening.countDocuments({ status: 'open' }),
    Application.countDocuments({ jobOpening: { $in: openJobIds }, stage: { $nin: ['Rejected', 'Hired'] } }),
    Application.countDocuments({ jobOpening: { $in: openJobIds }, stage: 'Interview', stageChangedAt: { $gte: weekStart } }),
    Application.countDocuments({ jobOpening: { $in: openJobIds }, stage: 'Hired', stageChangedAt: { $gte: monthStart } }),
    Application.aggregate([{ $match: { jobOpening: { $in: openJobIds } } }, { $group: { _id: '$stage', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Application.aggregate([{ $match: { jobOpening: { $in: openJobIds } } }, { $group: { _id: '$jobOpening', count: { $sum: 1 } } }]),
    Application.find({ appliedAt: { $gte: quarterStart }, jobOpening: { $in: openJobIds } }).select('appliedAt').lean()
  ]);

  const jobMap = new Map(openJobs.map(j => [j._id.toString(), j]));
  const byJobOpening = byJob.map(row => ({ jobOpeningId: row._id, title: jobMap.get(row._id.toString())?.title || 'Unknown', department: jobMap.get(row._id.toString())?.department || '', count: row.count }));

  const buckets = [];
  let cursor = startOfWeek(quarterStart);
  while (cursor <= now) { buckets.push({ week: weekKey(cursor), count: 0 }); cursor = addDays(cursor, 7); }
  const bucketMap = new Map(buckets.map(b => [b.week, b]));
  for (const app of receivedRaw) {
    const key = weekKey(startOfWeek(new Date(app.appliedAt)));
    if (bucketMap.has(key)) bucketMap.get(key).count += 1;
  }

  res.json({
    headline: { openPositions, activeApplications, interviewsThisWeek, hiresThisMonth },
    byStage: byStage.map(s => ({ stage: s._id, count: s.count })),
    byJobOpening,
    receivedPerWeek: buckets
  });
}
