const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getUsers,
  searchUser,
  updateProfile,
  changeRole
} = require('../controllers/userController');

router.use(protect);

router.get('/', adminOnly, getUsers);
router.get('/search', searchUser);
router.put('/profile', updateProfile);
router.put('/:id/role', adminOnly, changeRole);

module.exports = router;