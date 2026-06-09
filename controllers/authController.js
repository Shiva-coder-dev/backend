const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Member = require('../models/Member');
const AdminLog = require('../models/AdminLog');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { identifier, password, portal } = req.body;
    if (!identifier || !password) return res.status(400).json({ success: false, message: 'Email/ID and password required.' });

    let user;
    if (portal === 'admin') {
      user = await User.findOne({ email: identifier.toLowerCase(), role: 'admin' });
    } else {
      // Member login by memberId or email
      const memberDoc = await Member.findOne({
        $or: [{ memberId: identifier.toUpperCase() }, { email: identifier.toLowerCase() }]
      });
      if (memberDoc) user = await User.findOne({ memberId: memberDoc._id });
    }

    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    // Fetch member data if member role
    let memberData = null;
    if (user.role === 'member' && user.memberId) {
      memberData = await Member.findById(user.memberId);
    }

    await AdminLog.create({ action: `Login: ${user.name} (${user.role})`, performedBy: user._id, adminName: user.name, type: 'auth' });

    res.json({
      success: true,
      token: signToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
      member: memberData,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    let member = null;
    if (user.role === 'member' && user.memberId) {
      member = await Member.findById(user.memberId);
    }
    res.json({ success: true, user, member });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password incorrect.' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
