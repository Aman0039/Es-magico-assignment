const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { projectAccess, ownerOnly } = require('../middleware/projectAccess');
const projectController = require('../controllers/projectController');
const executionController = require('../controllers/executionController');

router.use(protect);

router.get('/', projectController.getProjects);
router.post('/', projectController.createProject);
router.get('/:id', projectAccess, projectController.getProject);
router.put('/:id', projectAccess, ownerOnly, projectController.updateProject);
router.delete('/:id', projectAccess, ownerOnly, projectController.deleteProject);
router.delete('/:id/members/:memberId', projectAccess, ownerOnly, projectController.removeMember);

// Execution & Simulation
router.post('/:projectId/compute-execution', projectAccess, executionController.computeExecution);
router.post('/:projectId/simulate', projectAccess, executionController.simulate);

// Webhook
router.get('/:projectId/webhook-logs', projectAccess, projectController.getWebhookLogs);

module.exports = router;
