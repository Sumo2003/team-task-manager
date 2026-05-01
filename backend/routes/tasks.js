const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  getDashboard
} = require('../controllers/taskController');

router.use(protect);

router.get('/dashboard', getDashboard);
router.route('/').get(getTasks).post(createTask);
router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);

module.exports = router;