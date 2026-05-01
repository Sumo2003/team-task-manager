const Task = require('../models/Task');
const Project = require('../models/Project');

// Helper: check if user is member of project
const isProjectMember = (project, userId) => {
  return project.members.some(m => m.user.toString() === userId.toString());
};

// @GET /api/tasks?project=id - Get tasks for a project
const getTasks = async (req, res) => {
  try {
    const { project, status, assignedTo } = req.query;
    if (!project) return res.status(400).json({ message: 'Project ID required' });

    const proj = await Project.findById(project);
    if (!proj) return res.status(404).json({ message: 'Project not found' });

    if (!isProjectMember(proj, req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const filter = { project };
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/tasks - Create task
const createTask = async (req, res) => {
  const { title, description, project, assignedTo, priority, dueDate } = req.body;
  if (!title || !project) return res.status(400).json({ message: 'Title and project are required' });

  try {
    const proj = await Project.findById(project);
    if (!proj) return res.status(404).json({ message: 'Project not found' });

    if (!isProjectMember(proj, req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only admin/project admin can assign tasks
    const projMember = proj.members.find(m => m.user.toString() === req.user._id.toString());
    const canAssign = req.user.role === 'admin' ||
      proj.owner.toString() === req.user._id.toString() ||
      (projMember && projMember.role === 'admin');

    const task = await Task.create({
      title,
      description,
      project,
      assignedTo: canAssign ? assignedTo : req.user._id,
      createdBy: req.user._id,
      priority,
      dueDate
    });

    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/tasks/:id
const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name members owner');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (!isProjectMember(task.project, req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project', 'members owner');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (!isProjectMember(task.project, req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, status, priority, dueDate, assignedTo } = req.body;

    // Members can only update status of tasks assigned to them
    const projMember = task.project.members.find(m => m.user.toString() === req.user._id.toString());
    const isAdmin = req.user.role === 'admin' ||
      task.project.owner.toString() === req.user._id.toString() ||
      (projMember && projMember.role === 'admin');

    if (isAdmin) {
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (priority) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (assignedTo !== undefined) task.assignedTo = assignedTo;
    }

    // All members can update status
    if (status) task.status = status;

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project', 'members owner');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const projMember = task.project.members.find(m => m.user.toString() === req.user._id.toString());
    const isAdmin = req.user.role === 'admin' ||
      task.project.owner.toString() === req.user._id.toString() ||
      (projMember && projMember.role === 'admin');

    if (!isAdmin) return res.status(403).json({ message: 'Only admins can delete tasks' });

    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/tasks/dashboard - Dashboard stats
const getDashboard = async (req, res) => {
  try {
    const Project = require('../models/Project');

    let projectQuery = req.user.role === 'admin'
      ? {}
      : { 'members.user': req.user._id };

    const projects = await Project.find(projectQuery).select('_id');
    const projectIds = projects.map(p => p._id);

    const [total, todo, inProgress, done, overdue] = await Promise.all([
      Task.countDocuments({ project: { $in: projectIds } }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'todo' }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'in-progress' }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'done' }),
      Task.countDocuments({
        project: { $in: projectIds },
        dueDate: { $lt: new Date() },
        status: { $ne: 'done' }
      })
    ]);

    const recentTasks = await Task.find({ project: { $in: projectIds } })
      .populate('assignedTo', 'name')
      .populate('project', 'name')
      .sort({ updatedAt: -1 })
      .limit(10);

    res.json({ total, todo, inProgress, done, overdue, projects: projectIds.length, recentTasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getTasks, createTask, getTask, updateTask, deleteTask, getDashboard };