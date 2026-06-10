const Samruthy = require('../models/Samruthy');
const Member = require('../models/Member');
const AdminLog = require('../models/AdminLog');

// GET /api/samruthy
exports.getAll = async (req, res) => {
  try {
    const entries = await Samruthy.find().sort({ date: -1 });
    const members = await Member.find().select('-password');
    const summary = members.map(m => {
      const memberEntries = entries.filter(e => e.memberId.toString() === m._id.toString());
      const total = memberEntries.reduce((a, e) => a + e.amount, 0);
      return {
        memberId: m._id,
        memberCode: m.memberId,
        name: m.name,
        color: m.color,
        total,
        entries: memberEntries,
      };
    });
    const grandTotal = entries.reduce((a, e) => a + e.amount, 0);
    res.json({ success: true, data: { entries, summary, grandTotal } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/samruthy/member/:memberId
exports.getMemberEntries = async (req, res) => {
  try {
    const entries = await Samruthy.find({ memberId: req.params.memberId }).sort({ date: -1 });
    const total = entries.reduce((a, e) => a + e.amount, 0);
    res.json({ success: true, data: { entries, total } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/samruthy
exports.addEntry = async (req, res) => {
  try {
    const { memberId, amount, date, note } = req.body;
    const member = await Member.findById(memberId);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });
    const entry = await Samruthy.create({
      memberId,
      memberName: member.name,
      memberMemberId: member.memberId,
      amount: Number(amount),
      date: date || new Date(),
      note,
      recordedBy: req.user._id,
    });
    await AdminLog.create({
      action: `Samruthy investment added: ${member.name} ₹${amount}`,
      performedBy: req.user._id,
      adminName: req.user.name,
      type: 'payment',
      targetMember: member.memberId,
    });
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/samruthy/:id
exports.deleteEntry = async (req, res) => {
  try {
    const entry = await Samruthy.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found.' });
    await entry.deleteOne();
    res.json({ success: true, message: 'Entry deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};