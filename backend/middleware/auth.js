// This is the JWT protection logic
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Access denied: Admins only' });
};

const projectAdmin = async (req, res, next) => {
  const Project = require('../models/Project');
  const project = await Project.findById(req.params.projectId || req.body.project);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const member = project.members.find(m => m.user.toString() === req.user._id.toString());
  const isOwner = project.owner.toString() === req.user._id.toString();

  if (!isOwner && (!member || member.role !== 'admin') && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Project admin required' });
  }
  req.project = project;
  next();
};

module.exports = { protect, adminOnly, projectAdmin };