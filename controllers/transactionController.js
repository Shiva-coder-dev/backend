const Transaction = require('../models/Transaction');
const Member = require('../models/Member');
const AdminLog = require('../models/AdminLog');

// GET /api/transactions?memberId=...
exports.getTransactions = async (req, res) => {
  try {
    const { memberId } = req.query;
    const query = memberId ? { memberId } : {};
    // Members can only see their own
    if (req.user.role === 'member') {
      const member = await Member.findOne({ _id: req.user.memberId });
      if (!member) return res.status(403).json({ success: false, message: 'Access denied.' });
      query.memberId = member._id;
    }
    const txns = await Transaction.find(query).populate('memberId', 'name memberId').sort({ date: -1 });
    res.json({ success: true, count: txns.length, data: txns });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/transactions
exports.addTransaction = async (req, res) => {
  try {
    const { memberId, amount, type, date, note } = req.body;
    const member = await Member.findById(memberId);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });

    const txn = await Transaction.create({ memberId, amount, type, date: date || new Date(), note, recordedBy: req.user._id });

    // Update member interestPaid
    if (['Interest', 'Principal+Interest', 'Full Closure'].includes(type)) {
      member.interestPaid += Number(amount);
      if (type === 'Full Closure') member.loanActive = false;
      await member.save();
    }

    await AdminLog.create({ action: `Payment recorded: ${member.name} ₹${amount} (${type})`, performedBy: req.user._id, adminName: req.user.name, type: 'payment', targetMember: member.memberId });
    res.status(201).json({ success: true, data: txn });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/transactions/:id
exports.deleteTransaction = async (req, res) => {
  try {
    const txn = await Transaction.findById(req.params.id);
    if (!txn) return res.status(404).json({ success: false, message: 'Transaction not found.' });
    await txn.deleteOne();
    res.json({ success: true, message: 'Transaction deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
