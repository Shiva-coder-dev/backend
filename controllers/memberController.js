const bcrypt = require('bcryptjs');
const Member = require('../models/Member');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const AdminLog = require('../models/AdminLog');

// GET /api/members
exports.getAllMembers = async (req, res) => {
  try {
    const { search, loanActive } = req.query;
    const query = {};
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { memberId: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    if (loanActive !== undefined) query.loanActive = loanActive === 'true';
    const members = await Member.find(query).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: members.length, data: members });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/members/:id
exports.getMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id).select('-password');
    if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });
    const transactions = await Transaction.find({ memberId: member._id }).sort({ date: -1 });
    res.json({ success: true, data: { ...member.toJSON(), transactions } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/members
exports.createMember = async (req, res) => {
  try {
    const { name, memberId, phone, email, address, password, loanAmount, loanStart, interestPct, loanActive, invested, notes, color } = req.body;
    const exists = await Member.findOne({ $or: [{ memberId }, { email }] });
    if (exists) return res.status(400).json({ success: false, message: 'Member ID or email already exists.' });

    const hashedPass = await bcrypt.hash(password || 'pass1234', 10);
    const member = await Member.create({ name, memberId, phone, email, address, password: hashedPass, loanAmount: loanAmount || 0, loanStart, interestPct: interestPct || 12, loanActive: loanActive || false, invested: invested || 0, notes, color: color || '#3b82f6' });

    // Create login user
    await User.create({ name, email, password: hashedPass, role: 'member', phone, memberId: member._id });

    await AdminLog.create({ action: `Member added: ${name} (${memberId})`, performedBy: req.user._id, adminName: req.user.name, type: 'member', targetMember: memberId });
    res.status(201).json({ success: true, data: member });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/members/:id
exports.updateMember = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;

    // Auto set loanActive based on loanAmount
    if (updateData.loanAmount !== undefined) {
      if (Number(updateData.loanAmount) > 0 && updateData.loanActive === undefined) {
        updateData.loanActive = true;
      }
      if (Number(updateData.loanAmount) === 0) {
        updateData.loanActive = false;
      }
    }

    const member = await Member.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).select('-password');
    if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });

    // Update user record too
    await User.findOneAndUpdate({ memberId: member._id }, { name: member.name, email: member.email, phone: member.phone });

    await AdminLog.create({ action: `Member updated: ${member.name} (${member.memberId})`, performedBy: req.user._id, adminName: req.user.name, type: 'member', targetMember: member.memberId });
    res.json({ success: true, data: member });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/members/:id
exports.deleteMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });
    await Transaction.deleteMany({ memberId: member._id });
    await User.deleteOne({ memberId: member._id });
    await member.deleteOne();
    await AdminLog.create({ action: `Member deleted: ${member.name} (${member.memberId})`, performedBy: req.user._id, adminName: req.user.name, type: 'member', targetMember: member.memberId });
    res.json({ success: true, message: 'Member deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/members/interest/global
exports.setGlobalInterest = async (req, res) => {
  try {
    const { rate } = req.body;
    if (!rate || rate <= 0 || rate > 50) return res.status(400).json({ success: false, message: 'Invalid rate.' });
    await Member.updateMany({ loanActive: true }, { interestPct: rate });
    await AdminLog.create({ action: `Global interest rate set to ${rate}%`, performedBy: req.user._id, adminName: req.user.name, type: 'interest' });
    res.json({ success: true, message: `Interest rate updated to ${rate}% for all active members.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/members/:id/interest
exports.setMemberInterest = async (req, res) => {
  try {
    const { rate } = req.body;
    const member = await Member.findByIdAndUpdate(req.params.id, { interestPct: rate }, { new: true }).select('-password');
    if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });
    await AdminLog.create({ action: `Interest rate for ${member.name} set to ${rate}%`, performedBy: req.user._id, adminName: req.user.name, type: 'interest', targetMember: member.memberId });
    res.json({ success: true, data: member });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/members/stats/summary
exports.getStats = async (req, res) => {
  try {
    const members = await Member.find().select('-password');
    const activeLoans = members.filter(m => m.loanActive);
    const stats = {
      totalMembers: members.length,
      totalInvested: members.reduce((a, m) => a + m.invested, 0),
      activeLoans: activeLoans.length,
      totalLoanBook: activeLoans.reduce((a, m) => a + m.loanAmount, 0),
      monthlyInterest: activeLoans.reduce((a, m) => a + m.monthlyInterest, 0),
      totalCollected: members.reduce((a, m) => a + m.interestPaid, 0),
      totalBalance: activeLoans.reduce((a, m) => a + m.balance, 0),
    };
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
