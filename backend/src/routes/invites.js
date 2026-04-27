const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');
const { projectAccess } = require('../middleware/projectAccess');
const { log } = require('../utils/auditLogger');
const { getIO } = require('../sockets');

// Generate invite link
router.post('/project/:projectId/generate', protect, projectAccess, async (req, res, next) => {
  try {
    const secret = process.env.INVITE_TOKEN_SECRET || process.env.JWT_SECRET;
    const token = jwt.sign(
      { projectId: req.params.projectId, invitedBy: req.user._id },
      secret,
      { expiresIn: '30m' }
    );

    await log({
      actor: req.user._id,
      action: 'invite_generate',
      entity: 'invite',
      project: req.params.projectId,
      metadata: { token: token.substring(0, 20) + '...' }
    });

    const inviteUrl = `${process.env.CLIENT_URL}/invite/${token}`;
    res.json({ token, inviteUrl, expiresIn: '30 minutes' });
  } catch (error) {
    next(error);
  }
});

// Validate invite token
router.get('/validate/:token', protect, async (req, res, next) => {
  try {
    const secret = process.env.INVITE_TOKEN_SECRET || process.env.JWT_SECRET;
    const decoded = jwt.verify(req.params.token, secret);

    const project = await Project.findById(decoded.projectId)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const alreadyMember = project.members.some(m => m._id.toString() === req.user._id.toString())
      || project.owner._id.toString() === req.user._id.toString();

    res.json({ project, alreadyMember, invitedBy: decoded.invitedBy });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Invite link has expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ error: 'Invalid invite link' });
    }
    next(error);
  }
});

// Accept invite
router.post('/accept/:token', protect, async (req, res, next) => {
  try {
    const secret = process.env.INVITE_TOKEN_SECRET || process.env.JWT_SECRET;
    const decoded = jwt.verify(req.params.token, secret);

    const project = await Project.findById(decoded.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const userId = req.user._id.toString();
    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some(m => m.toString() === userId);

    if (isOwner || isMember) {
      return res.status(400).json({ error: 'You are already a member of this project' });
    }

    project.members.push(req.user._id);
    await project.save();

    await project.populate('owner members', 'name email avatar');

    await log({
      actor: req.user._id,
      action: 'member_join',
      entity: 'project',
      entityId: project._id,
      project: project._id,
      metadata: { projectName: project.name }
    });

    const io = getIO();
    if (io) io.to(`project:${project._id}`).emit('project:member_joined', { project, user: req.user });

    res.json({ project, message: `Successfully joined ${project.name}` });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Invite link has expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ error: 'Invalid invite link' });
    }
    next(error);
  }
});

module.exports = router;
