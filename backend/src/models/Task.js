const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    minlength: 2,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000,
    default: ''
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  estimatedHours: {
    type: Number,
    min: 0.5,
    max: 999,
    default: 1
  },
  status: {
    type: String,
    enum: ['Pending', 'Running', 'Completed', 'Failed', 'Blocked'],
    default: 'Pending'
  },
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  resourceTag: {
    type: String,
    trim: true,
    default: ''
  },
  maxRetries: {
    type: Number,
    min: 0,
    max: 10,
    default: 3
  },
  retryCount: {
    type: Number,
    default: 0
  },
  versionNumber: {
    type: Number,
    default: 1
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  completedAt: {
    type: Date,
    default: null
  },
  tags: [String]
}, {
  timestamps: true
});

taskSchema.index({ project: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Task', taskSchema);
