import mongoose from 'mongoose';

const alertDismissalSchema = new mongoose.Schema({
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, index: true },
  stage: { type: String, required: true, index: true },
  dismissedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dismissedAt: { type: Date, default: Date.now }
});

alertDismissalSchema.index({ application: 1, stage: 1, dismissedBy: 1 }, { unique: true });

export default mongoose.model('AlertDismissal', alertDismissalSchema);
