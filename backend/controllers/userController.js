const User = require('../models/User');

// @GET /api/users - Get all users (admin only)
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/users/search?email=...  - Search user by email (for adding to project)
const searchUser = async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: 'Email required' });

  try {
    const user = await User.findOne({ email }).select('name email role');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @PUT /api/users/profile - Update own profile
const updateProfile = async (req, res) => {
  const { name, avatar } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @PUT /api/users/:id/role - Change user role (admin only)
const changeRole = async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'member'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getUsers, searchUser, updateProfile, changeRole };