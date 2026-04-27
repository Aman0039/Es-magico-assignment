const Project = require('../models/Project');
const Task = require('../models/Task');
const WebhookLog = require('../models/WebhookLog');
const { log } = require('../utils/auditLogger');
const { getIO } = require('../sockets');

const getProjects = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const userId = req.user._id;

    const query = {
      $or: [{ owner: userId }, { members: userId }]
    };

    if (search) {
      query.$text = { $search: search };
    }
    if (status) {
      query.status = status;
    }

    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({ projects });
  } catch (error) {
    next(error);
  }
};

const createProject = async (req, res, next) => {
  try {
    const { name, description, color, webhookUrl } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Project name must be at least 2 characters' });
    }

    const project = await Project.create({
      name: name.trim(),
      description: description?.trim() || '',
      color: color || '#6366f1',
      webhookUrl: webhookUrl || null,
      owner: req.user._id,
      members: []
    });

    await project.populate('owner', 'name email avatar');

    await log({ actor: req.user._id, action: 'project_create', entity: 'project', entityId: project._id, metadata: { name: project.name } });

    const io = getIO();
    if (io) io.emit('project:created', project);

    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
};

const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    const taskStats = await Task.aggregate([
      { $match: { project: project._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const stats = { total: 0, Pending: 0, Running: 0, Completed: 0, Failed: 0, Blocked: 0 };
    for (const s of taskStats) {
      stats[s._id] = s.count;
      stats.total += s.count;
    }

    res.json({ project, stats });
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const { name, description, color, status, webhookUrl, settings } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (color) updates.color = color;
    if (status) updates.status = status;
    if (webhookUrl !== undefined) updates.webhookUrl = webhookUrl || null;
    if (settings) updates.settings = settings;

    const project = await Project.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    await log({ actor: req.user._id, action: 'project_update', entity: 'project', entityId: project._id });

    const io = getIO();
    if (io) io.to(`project:${project._id}`).emit('project:updated', project);

    res.json({ project });
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    await Task.deleteMany({ project: req.params.id });
    await Project.findByIdAndDelete(req.params.id);

    await log({ actor: req.user._id, action: 'project_delete', entity: 'project', entityId: req.params.id });

    const io = getIO();
    if (io) io.emit('project:deleted', { projectId: req.params.id });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $pull: { members: req.params.memberId } },
      { new: true }
    ).populate('owner members', 'name email avatar');

    res.json({ project });
  } catch (error) {
    next(error);
  }
};

const getWebhookLogs = async (req, res, next) => {
  try {
    const logs = await WebhookLog.find({ project: req.params.projectId })
      .populate('task', 'title status')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ logs });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProjects, createProject, getProject, updateProject, deleteProject, removeMember, getWebhookLogs };
