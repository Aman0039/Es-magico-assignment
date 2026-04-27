const mongoose = require('mongoose');

const taskVersionSchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  versionNumber: {
    type: Number,
    required: true
  },
  snapshot: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  changeDescription: {
    type: String,
    default: 'Task updated'
  }
}, {
  timestamps: true
});

taskVersionSchema.index({ task: 1, versionNumber: -1 });

module.exports = mongoose.model('TaskVersion', taskVersionSchema);
