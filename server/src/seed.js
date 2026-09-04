import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDb } from './config/db.js';
import User from './models/User.js';
import JobOpening from './models/JobOpening.js';
import Application from './models/Application.js';
import TimelineEvent from './models/TimelineEvent.js';
import AlertDismissal from './models/AlertDismissal.js';
import { createTimelineEvent } from './services/timeline.service.js';

function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d; }
function thisMonthDay(day) { const d = new Date(); d.setDate(Math.min(day, 25)); d.setHours(10,0,0,0); return d; }

async function main() {
  await connectDb();
  await Promise.all([User.deleteMany({}), JobOpening.deleteMany({}), Application.deleteMany({}), TimelineEvent.deleteMany({}), AlertDismissal.deleteMany({})]);
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const [recruiter, interviewer1, interviewer2] = await User.create([
    { name: 'Recruiter One', email: 'recruiter@example.com', passwordHash, role: 'recruiter' },
    { name: 'Interviewer One', email: 'interviewer@example.com', passwordHash, role: 'interviewer' },
    { name: 'Interviewer Two', email: 'interviewer2@example.com', passwordHash, role: 'interviewer' }
  ]);

  const [frontend, sales, support, legacy] = await JobOpening.create([
    { title: 'Frontend Engineer', department: 'Engineering', description: 'Build React interfaces and collaborate with product teams.', status: 'open', createdBy: recruiter._id },
    { title: 'Account Executive', department: 'Sales', description: 'Own new customer conversations and close revenue.', status: 'open', createdBy: recruiter._id },
    { title: 'Customer Support Specialist', department: 'Support', description: 'Help customers succeed with quick and thoughtful support.', status: 'open', createdBy: recruiter._id },
    { title: 'Legacy Backend Engineer', department: 'Engineering', description: 'Archived opening retained with historical applications.', status: 'archived', createdBy: recruiter._id }
  ]);

  const rows = [
    ['Asha Sharma','asha@example.com','LinkedIn',frontend,'Applied',2,[interviewer1]],
    ['Rohit Verma','rohit@example.com','Referral',frontend,'Screening',12,[interviewer1]],
    ['Neha Jain','neha@example.com','Careers Page',frontend,'Interview',5,[interviewer1, interviewer2]],
    ['Kabir Khan','kabir@example.com','Indeed',frontend,'Offer',13,[interviewer2]],
    ['Priya Nair','priya@example.com','Agency',frontend,'Hired',3,[interviewer1]],
    ['Maya Iyer','maya@example.com','LinkedIn',sales,'Applied',15,[]],
    ['Arjun Mehta','arjun@example.com','Referral',sales,'Screening',4,[interviewer2]],
    ['Sara Ali','sara@example.com','Careers Page',sales,'Interview',11,[interviewer2]],
    ['Dev Patel','dev@example.com','Indeed',sales,'Offer',1,[interviewer1]],
    ['Ishita Rao','ishita@example.com','Agency',sales,'Rejected',7,[interviewer1]],
    ['Vikram Singh','vikram@example.com','LinkedIn',support,'Applied',21,[]],
    ['Ananya Das','ananya@example.com','Referral',support,'Screening',6,[interviewer1]],
    ['Farhan Qureshi','farhan@example.com','Careers Page',support,'Interview',12,[interviewer2]],
    ['Tara Bose','tara@example.com','Indeed',support,'Rejected',18,[interviewer1, interviewer2]],
    ['Nikhil Joshi','nikhil@example.com','LinkedIn',legacy,'Screening',30,[interviewer1]]
  ];

  for (const [name,email,source,job,stage,age,panel] of rows) {
    const nowStage = daysAgo(age);
    const app = await Application.create({
      jobOpening: job._id,
      candidateName: name,
      candidateEmail: email,
      source,
      notes: `${name} applied via ${source}.`,
      stage,
      previousStageBeforeRejection: stage === 'Rejected' ? 'Interview' : null,
      rejectedAt: stage === 'Rejected' ? nowStage : null,
      stageChangedAt: stage === 'Hired' ? thisMonthDay(3) : nowStage,
      appliedAt: daysAgo(age + 7),
      assignedInterviewers: panel.map(u => u._id),
      createdBy: recruiter._id
    });
    await createTimelineEvent({ application: app._id, type: 'created', actor: recruiter._id, newStage: 'Applied', message: 'Application created', createdAt: app.appliedAt });
    if (stage !== 'Applied') await createTimelineEvent({ application: app._id, type: stage === 'Rejected' ? 'rejected' : 'stage_change', actor: recruiter._id, oldStage: stage === 'Rejected' ? 'Interview' : 'Applied', newStage: stage, message: stage === 'Rejected' ? 'Application rejected from Interview' : `Stage changed to ${stage}` });
    if (panel.length) await createTimelineEvent({ application: app._id, type: 'panel_updated', actor: recruiter._id, message: `Interview panel updated (${panel.map(u => u.name).join(', ')})` });
    if (panel.length && ['Interview','Offer','Hired','Rejected'].includes(stage)) await createTimelineEvent({ application: app._id, type: 'feedback', actor: panel[0]._id, message: 'Feedback added', feedbackText: `${name} showed relevant experience and clear communication.` });
  }

  console.log('Seed complete. Demo credentials: recruiter@example.com / Password123!, interviewer@example.com / Password123!');
  await mongoose.disconnect();
}
main().catch(err => { console.error(err); process.exit(1); });
