const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');
const { projectAccess } = require('../middleware/projectAccess');

// Get user's personal audit logs
router.get('/me', protect, async (req, res, next) => {
  try {
    const logs = await AuditLog.find({ actor: req.user._id })
      .populate('actor', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ logs });
  } catch (error) {
    next(error);
  }
});

// Get project audit logs
router.get('/project/:projectId', protect, projectAccess, async (req, res, next) => {
  try {
    const { action, entity, limit = 50, page = 1 } = req.query;
    const query = { project: req.params.projectId };
    if (action) query.action = action;
    if (entity) query.entity = entity;

    const logs = await AuditLog.find(query)
      .populate('actor', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await AuditLog.countDocuments(query);

    res.json({ logs, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
