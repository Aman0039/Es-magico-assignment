const Project = require('../models/Project');
const { createError } = require('./errorHandler');

const projectAccess = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId || req.params.id);

    if (!project) {
      return next(createError('Project not found', 404));
    }

    const userId = req.user._id.toString();
    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some(m => m.toString() === userId);

    if (!isOwner && !isMember) {
      return next(createError('Access denied: not a project member', 403));
    }

    req.project = project;
    req.isOwner = isOwner;
    next();
  } catch (error) {
    next(error);
  }
};

const ownerOnly = async (req, res, next) => {
  if (!req.isOwner) {
    return next(createError('Only project owner can perform this action', 403));
  }
  next();
};

module.exports = { projectAccess, ownerOnly };
