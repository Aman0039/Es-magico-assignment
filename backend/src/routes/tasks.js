const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { projectAccess } = require('../middleware/projectAccess');
const taskController = require('../controllers/taskController');

router.use(protect);

// All task routes are scoped to a project
router.get('/project/:projectId', projectAccess, taskController.getTasks);
router.post('/project/:projectId', projectAccess, taskController.createTask);
router.get('/:id', protect, taskController.getTask);
router.put('/:id', protect, taskController.updateTask);
router.delete('/:id', protect, taskController.deleteTask);
router.post('/:id/duplicate', protect, taskController.duplicateTask);
router.post('/:id/retry', protect, taskController.retryTask);
router.get('/:id/history', protect, taskController.getTaskHistory);
router.post('/:id/restore/:versionNumber', protect, taskController.restoreVersion);

module.exports = router;
