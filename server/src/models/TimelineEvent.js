import mongoose from 'mongoose';

const timelineEventSchema = new mongoose.Schema({
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, index: true },
  type: {
    type: String,
    enum: ['created', 'updated', 'stage_change', 'rejected', 'reinstated', 'feedback', 'panel_updated', 'alert_dismissed'],
    required: true,
    index: true
  },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  oldStage: { type: String, default: null },
  newStage: { type: String, default: null },
  message: { type: String, required: true },
  feedbackText: { type: String, default: null }
}, { timestamps: { createdAt: true, updatedAt: false } });

export default mongoose.model('TimelineEvent', timelineEventSchema);
