const mongoose = require('mongoose');

const webhookLogSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  webhookUrl: {
    type: String,
    required: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'pending'
  },
  attempts: {
    type: Number,
    default: 0
  },
  responseStatus: {
    type: Number,
    default: null
  },
  responseBody: {
    type: String,
    default: null
  },
  error: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

webhookLogSchema.index({ project: 1 });
webhookLogSchema.index({ task: 1 });

module.exports = mongoose.model('WebhookLog', webhookLogSchema);
