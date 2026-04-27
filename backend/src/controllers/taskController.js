const Task = require('../models/Task');
const TaskVersion = require('../models/TaskVersion');
const Project = require('../models/Project');
const { log } = require('../utils/auditLogger');
const { detectCycle, buildAdjacencyMap } = require('../utils/cycleDetection');
const { fireWebhook } = require('../utils/webhook');
const { getIO } = require('../sockets');

const getTasks = async (req, res, next) => {
  try {
    const { search, status, priority, sort = 'createdAt', order = 'desc', resourceTag } = req.query;
    const projectId = req.params.projectId;

    const query = { project: projectId };
    if (status) query.status = status;
    if (priority) query.priority = parseInt(priority);
    if (resourceTag) query.resourceTag = resourceTag;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const tasks = await Task.find(query)
      .populate('dependencies', 'title status priority')
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort({ [sort]: sortOrder });

    res.json({ tasks });
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, estimatedHours, status, dependencies, resourceTag, maxRetries, assignee, tags } = req.body;
    const projectId = req.params.projectId;

    if (!title || title.trim().length < 2) {
      return res.status(400).json({ error: 'Task title must be at least 2 characters' });
    }

    // Validate dependencies & cycle detection
    if (dependencies && dependencies.length > 0) {
      const allTasks = await Task.find({ project: projectId }).select('_id dependencies');
      const adjMap = buildAdjacencyMap(allTasks);
      const tempId = 'new_task';
      const { hasCycle, cycle } = detectCycle(tempId, dependencies, adjMap);

      if (hasCycle) {
        await log({ actor: req.user._id, action: 'dependency_cycle_detected', entity: 'task', project: projectId, metadata: { cycle } });
        return res.status(400).json({ error: 'Circular dependency detected', cycle });
      }
    }

    const task = await Task.create({
      title: title.trim(),
      description: description?.trim() || '',
      project: projectId,
      priority: priority || 3,
      estimatedHours: estimatedHours || 1,
      status: status || 'Pending',
      dependencies: dependencies || [],
      resourceTag: resourceTag || '',
      maxRetries: maxRetries !== undefined ? maxRetries : 3,
      assignee: assignee || null,
      tags: tags || [],
      createdBy: req.user._id,
      versionNumber: 1
    });

    await task.populate(['dependencies', 'assignee', 'createdBy']);

    // Save initial version
    await TaskVersion.create({
      task: task._id,
      project: projectId,
      versionNumber: 1,
      snapshot: task.toObject(),
      changedBy: req.user._id,
      changeDescription: 'Task created'
    });

    await log({ actor: req.user._id, action: 'task_create', entity: 'task', entityId: task._id, project: projectId, metadata: { title: task.title } });

    const io = getIO();
    if (io) io.to(`project:${projectId}`).emit('task:created', task);

    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
};

const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('dependencies', 'title status priority estimatedHours')
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email');

    if (!task) return res.status(404).json({ error: 'Task not found' });

    res.json({ task });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { versionNumber, ...updates } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Optimistic concurrency check
    if (versionNumber !== undefined && task.versionNumber !== versionNumber) {
      const latest = await Task.findById(req.params.id).populate('dependencies assignee createdBy');
      await log({ actor: req.user._id, action: 'version_conflict', entity: 'task', entityId: task._id, project: task.project });
      return res.status(409).json({
        error: 'Version conflict: This task was updated by another user.',
        currentVersion: task.versionNumber,
        latestTask: latest
      });
    }

    // Cycle detection for dependency changes
    if (updates.dependencies) {
      const selfId = task._id.toString();
      if (updates.dependencies.includes(selfId)) {
        return res.status(400).json({ error: 'A task cannot depend on itself' });
      }

      const allTasks = await Task.find({ project: task.project }).select('_id dependencies');
      const adjMap = buildAdjacencyMap(allTasks);
      const { hasCycle, cycle } = detectCycle(selfId, updates.dependencies, adjMap);

      if (hasCycle) {
        await log({ actor: req.user._id, action: 'dependency_cycle_detected', entity: 'task', entityId: task._id, project: task.project, metadata: { cycle } });
        return res.status(400).json({ error: 'Circular dependency detected', cycle });
      }
    }

    const wasCompleted = task.status !== 'Completed' && updates.status === 'Completed';
    const newVersion = task.versionNumber + 1;
    updates.versionNumber = newVersion;

    if (updates.status === 'Completed') updates.completedAt = new Date();

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('dependencies', 'title status priority').populate('assignee createdBy', 'name email avatar');

    // Save version snapshot
    await TaskVersion.create({
      task: task._id,
      project: task.project,
      versionNumber: newVersion,
      snapshot: updatedTask.toObject(),
      changedBy: req.user._id,
      changeDescription: updates.status ? `Status changed to ${updates.status}` : 'Task updated'
    });

    await log({ actor: req.user._id, action: 'task_update', entity: 'task', entityId: task._id, project: task.project, metadata: { changes: Object.keys(updates) } });

    const io = getIO();
    if (io) io.to(`project:${task.project}`).emit('task:updated', updatedTask);

    // Fire webhook on completion
    if (wasCompleted) {
      const project = await Project.findById(task.project);
      if (project) fireWebhook(project, updatedTask).catch(console.error);
    }

    res.json({ task: updatedTask });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Remove from other tasks' dependencies
    await Task.updateMany({ dependencies: task._id }, { $pull: { dependencies: task._id } });

    await Task.findByIdAndDelete(req.params.id);
    await TaskVersion.deleteMany({ task: req.params.id });

    await log({ actor: req.user._id, action: 'task_delete', entity: 'task', entityId: task._id, project: task.project, metadata: { title: task.title } });

    const io = getIO();
    if (io) io.to(`project:${task.project}`).emit('task:deleted', { taskId: req.params.id, projectId: task.project });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const duplicateTask = async (req, res, next) => {
  try {
    const original = await Task.findById(req.params.id);
    if (!original) return res.status(404).json({ error: 'Task not found' });

    const dup = await Task.create({
      ...original.toObject(),
      _id: undefined,
      title: `${original.title} (Copy)`,
      status: 'Pending',
      retryCount: 0,
      versionNumber: 1,
      completedAt: null,
      createdBy: req.user._id,
      createdAt: undefined,
      updatedAt: undefined
    });

    await TaskVersion.create({
      task: dup._id,
      project: dup.project,
      versionNumber: 1,
      snapshot: dup.toObject(),
      changedBy: req.user._id,
      changeDescription: `Duplicated from task "${original.title}"`
    });

    await dup.populate('dependencies assignee createdBy');

    await log({ actor: req.user._id, action: 'task_duplicate', entity: 'task', entityId: dup._id, project: dup.project });

    const io = getIO();
    if (io) io.to(`project:${dup.project}`).emit('task:created', dup);

    res.status(201).json({ task: dup });
  } catch (error) {
    next(error);
  }
};

const retryTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (task.status !== 'Failed') {
      return res.status(400).json({ error: 'Only failed tasks can be retried' });
    }

    if (task.retryCount >= task.maxRetries) {
      return res.status(400).json({ error: `Maximum retries (${task.maxRetries}) reached` });
    }

    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      { status: 'Running', $inc: { retryCount: 1, versionNumber: 1 } },
      { new: true }
    ).populate('dependencies assignee createdBy');

    await log({ actor: req.user._id, action: 'task_retry', entity: 'task', entityId: task._id, project: task.project, metadata: { retryCount: updated.retryCount } });

    const io = getIO();
    if (io) io.to(`project:${task.project}`).emit('task:updated', updated);

    res.json({ task: updated });
  } catch (error) {
    next(error);
  }
};

const getTaskHistory = async (req, res, next) => {
  try {
    const history = await TaskVersion.find({ task: req.params.id })
      .populate('changedBy', 'name email avatar')
      .sort({ versionNumber: -1 });

    res.json({ history });
  } catch (error) {
    next(error);
  }
};

const restoreVersion = async (req, res, next) => {
  try {
    const { id, versionNumber } = req.params;
    const version = await TaskVersion.findOne({ task: id, versionNumber: parseInt(versionNumber) });

    if (!version) return res.status(404).json({ error: 'Version not found' });

    const current = await Task.findById(id);
    const restoredData = { ...version.snapshot };
    delete restoredData._id;
    delete restoredData.__v;
    restoredData.versionNumber = current.versionNumber + 1;

    const task = await Task.findByIdAndUpdate(id, restoredData, { new: true })
      .populate('dependencies assignee createdBy');

    await TaskVersion.create({
      task: id,
      project: task.project,
      versionNumber: restoredData.versionNumber,
      snapshot: task.toObject(),
      changedBy: req.user._id,
      changeDescription: `Restored to version ${versionNumber}`
    });

    await log({ actor: req.user._id, action: 'version_restore', entity: 'task', entityId: id, project: task.project, metadata: { restoredTo: versionNumber } });

    const io = getIO();
    if (io) io.to(`project:${task.project}`).emit('task:updated', task);

    res.json({ task });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, createTask, getTask, updateTask, deleteTask, duplicateTask, retryTask, getTaskHistory, restoreVersion };
