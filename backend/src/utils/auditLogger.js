const AuditLog = require('../models/AuditLog');

const log = async ({ actor, action, entity, entityId, project, metadata = {} }) => {
  try {
    await AuditLog.create({
      actor,
      action,
      entity,
      entityId: entityId || null,
      project: project || null,
      metadata
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = { log };
