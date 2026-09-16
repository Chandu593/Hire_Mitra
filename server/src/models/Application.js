import mongoose from 'mongoose';

export const ACTIVE_STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];
export const ALL_STAGES = [...ACTIVE_STAGES, 'Rejected'];

const applicationSchema = new mongoose.Schema({
  jobOpening: { type: mongoose.Schema.Types.ObjectId, ref: 'JobOpening', required: true, index: true },
  candidateName: { type: String, required: true, trim: true, index: true },
  candidateEmail: { type: String, required: true, lowercase: true, trim: true, index: true, unique: true },
  source: { type: String, required: true, trim: true, index: true },
  notes: { type: String, default: '' },
  stage: { type: String, enum: ALL_STAGES, default: 'Applied', index: true },
  previousStageBeforeRejection: { type: String, enum: [...ACTIVE_STAGES, null], default: null },
  rejectedAt: { type: Date, default: null },
  stageChangedAt: { type: Date, default: Date.now, index: true },
  assignedInterviewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
  appliedAt: { type: Date, default: Date.now, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

applicationSchema.index({ candidateName: 'text', candidateEmail: 'text' });
applicationSchema.index(
  { jobOpening: 1, candidateEmail: 1 },
  { unique: true }
);

export default mongoose.model('Application', applicationSchema);
