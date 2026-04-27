const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'signup', 'login', 'logout',
      'project_create', 'project_update', 'project_delete',
      'invite_generate', 'member_join',
      'task_create', 'task_update', 'task_delete', 'task_duplicate',
      'task_status_change', 'task_retry', 'task_fail',
      'dependency_rejected', 'dependency_cycle_detected',
      'webhook_fired', 'webhook_failed',
      'version_conflict', 'version_restore'
    ]
  },
  entity: {
    type: String,
    enum: ['user', 'project', 'task', 'invite', 'webhook'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

auditLogSchema.index({ actor: 1 });
auditLogSchema.index({ project: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
