const express = require('express');
const router = express.Router();
const WebhookLog = require('../models/WebhookLog');
const { protect } = require('../middleware/auth');
const { projectAccess } = require('../middleware/projectAccess');

router.get('/project/:projectId', protect, projectAccess, async (req, res, next) => {
  try {
    const logs = await WebhookLog.find({ project: req.params.projectId })
      .populate('task', 'title status')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ logs });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
