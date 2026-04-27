const Task = require('../models/Task');
const { topologicalSort } = require('../utils/cycleDetection');

/**
 * Execution Planner Engine
 * POST /projects/:projectId/compute-execution
 */
const computeExecution = async (req, res, next) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('dependencies', '_id status');

    // Separate blocked tasks (have unresolved failed dependencies)
    const completedIds = new Set(tasks.filter(t => t.status === 'Completed').map(t => t._id.toString()));
    const failedIds = new Set(tasks.filter(t => t.status === 'Failed').map(t => t._id.toString()));

    const isBlocked = (task) => {
      return task.dependencies.some(dep => {
        const depId = dep._id ? dep._id.toString() : dep.toString();
        return failedIds.has(depId) || (dep.status === 'Failed');
      });
    };

    const areDepsComplete = (task) => {
      return task.dependencies.every(dep => {
        const depId = dep._id ? dep._id.toString() : dep.toString();
        return completedIds.has(depId) || (dep.status === 'Completed');
      });
    };

    const blockedTasks = tasks.filter(t => isBlocked(t) && t.status !== 'Completed');
    const blockedIds = new Set(blockedTasks.map(t => t._id.toString()));

    // Runnable: not completed, not blocked, all deps complete
    const runnableTasks = tasks.filter(t =>
      t.status !== 'Completed' &&
      !blockedIds.has(t._id.toString()) &&
      areDepsComplete(t)
    );

    // Sort: priority desc, estimatedHours asc, createdAt asc (deterministic)
    runnableTasks.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      if (a.estimatedHours !== b.estimatedHours) return a.estimatedHours - b.estimatedHours;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    // Resolve resource conflicts: same resourceTag can't run concurrently
    const usedResources = new Set();
    const executionOrder = [];

    for (const task of runnableTasks) {
      if (task.resourceTag && usedResources.has(task.resourceTag)) {
        continue; // Skip due to resource conflict
      }
      if (task.resourceTag) usedResources.add(task.resourceTag);
      executionOrder.push(task);
    }

    res.json({
      executionOrder: executionOrder.map(t => ({
        _id: t._id, title: t.title, priority: t.priority,
        estimatedHours: t.estimatedHours, status: t.status, resourceTag: t.resourceTag
      })),
      runnableTasks: runnableTasks.map(t => ({ _id: t._id, title: t.title, status: t.status })),
      blockedTasks: blockedTasks.map(t => ({ _id: t._id, title: t.title, status: t.status })),
      summary: {
        total: tasks.length,
        runnable: runnableTasks.length,
        blocked: blockedTasks.length,
        completed: completedIds.size,
        executionCount: executionOrder.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Daily Simulation Engine
 * POST /projects/:projectId/simulate
 * Body: { availableHours, failedTaskIds? }
 */
const simulate = async (req, res, next) => {
  try {
    const { availableHours = 8, failedTaskIds = [] } = req.body;

    if (!availableHours || availableHours <= 0) {
      return res.status(400).json({ error: 'availableHours must be greater than 0' });
    }

    const tasks = await Task.find({ project: req.params.projectId })
      .populate('dependencies', '_id status title');

    const failedSet = new Set(failedTaskIds.map(id => id.toString()));
    const completedIds = new Set(tasks.filter(t => t.status === 'Completed').map(t => t._id.toString()));

    // Mark additional failed tasks from input
    failedTaskIds.forEach(id => {
      const task = tasks.find(t => t._id.toString() === id.toString());
      if (task) task.status = 'Failed';
    });

    const isTaskBlocked = (task) => {
      return task.dependencies.some(dep => {
        const depId = dep._id ? dep._id.toString() : dep.toString();
        return failedSet.has(depId) || dep.status === 'Failed';
      });
    };

    const areDepsComplete = (task) => {
      return task.dependencies.every(dep => {
        const depId = dep._id ? dep._id.toString() : dep.toString();
        return completedIds.has(depId) || dep.status === 'Completed';
      });
    };

    const blockedTasks = [];
    const skippedTasks = [];
    const candidates = [];

    for (const task of tasks) {
      if (task.status === 'Completed') continue;
      if (isTaskBlocked(task)) {
        blockedTasks.push(task);
        continue;
      }
      if (!areDepsComplete(task)) {
        skippedTasks.push(task);
        continue;
      }
      candidates.push(task);
    }

    // Sort: priority desc, estimatedHours asc, createdAt asc
    candidates.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      if (a.estimatedHours !== b.estimatedHours) return a.estimatedHours - b.estimatedHours;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    // Greedy selection within available hours
    let remainingHours = availableHours;
    const selectedTasks = [];
    const usedResources = new Set();
    let totalPriorityScore = 0;

    for (const task of candidates) {
      if (task.estimatedHours > remainingHours) continue;
      if (task.resourceTag && usedResources.has(task.resourceTag)) continue;

      selectedTasks.push(task);
      remainingHours -= task.estimatedHours;
      if (task.resourceTag) usedResources.add(task.resourceTag);
      totalPriorityScore += task.priority;

      if (remainingHours <= 0) break;
    }

    const notSelected = candidates.filter(t => !selectedTasks.includes(t));
    skippedTasks.push(...notSelected);

    res.json({
      executionOrder: selectedTasks.map((t, i) => ({ rank: i + 1, _id: t._id, title: t.title, priority: t.priority, estimatedHours: t.estimatedHours, resourceTag: t.resourceTag })),
      selectedTasks: selectedTasks.map(t => ({ _id: t._id, title: t.title, priority: t.priority, estimatedHours: t.estimatedHours })),
      blockedTasks: blockedTasks.map(t => ({ _id: t._id, title: t.title })),
      skippedTasks: skippedTasks.map(t => ({ _id: t._id, title: t.title, reason: 'Hours exceeded or deps incomplete' })),
      totalPriorityScore,
      summary: {
        availableHours,
        hoursUsed: availableHours - remainingHours,
        hoursRemaining: remainingHours,
        tasksSelected: selectedTasks.length,
        tasksBlocked: blockedTasks.length,
        tasksSkipped: skippedTasks.length
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { computeExecution, simulate };
