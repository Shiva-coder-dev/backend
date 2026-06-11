const Fine = require('../models/Fine');
const Member = require('../models/Member');
const AdminLog = require('../models/AdminLog');

// GET /api/fines
exports.getAll = async (req, res) => {
  try {
    const fines = await Fine.find().sort({ date: -1 });
    const members = await Member.find().select('-password');

    const summary = members.map(m => {
      const memberFines = fines.filter(f => f.memberId.toString() === m._id.toString());
      const totalFine = memberFines.reduce((a, f) => a + f.amount, 0);
      const paidFine = memberFines.filter(f => f.isPaid).reduce((a, f) => a + f.amount, 0);
      const unpaidFine = totalFine - paidFine;
      return {
        memberId: m._id,
        memberCode: m.memberId,
        name: m.name,
        color: m.color,
        totalFine,
        paidFine,
        unpaidFine,
        fines: memberFines,
      };
    });

    const grandTotal = fines.reduce((a, f) => a + f.amount, 0);
    const totalPaid = fines.filter(f => f.isPaid).reduce((a, f) => a + f.amount, 0);
    const totalUnpaid = grandTotal - totalPaid;

    res.json({ success: true, data: { fines, summary, grandTotal, totalPaid, totalUnpaid } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/fines/member/:memberId
exports.getMemberFines = async (req, res) => {
  try {
    const fines = await Fine.find({ memberId: req.params.memberId }).sort({ date: -1 });
    const totalFine = fines.reduce((a, f) => a + f.amount, 0);
    const paidFine = fines.filter(f => f.isPaid).reduce((a, f) => a + f.amount, 0);
    const unpaidFine = totalFine - paidFine;
    res.json({ success: true, data: { fines, totalFine, paidFine, unpaidFine } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/fines
exports.addFine = async (req, res) => {
  try {
    const { memberId, amount, reason, fineType, date, note } = req.body;
    const member = await Member.findById(memberId);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });

    const fine = await Fine.create({
      memberId,
      memberName: member.name,
      memberMemberId: member.memberId,
      amount: Number(amount),
      reason,
      fineType: fineType || 'Other',
      date: date || new Date(),
      note,
      recordedBy: req.user._id,
    });

    await AdminLog.create({
      action: `Fine added: ${member.name} ₹${amount} (${fineType})`,
      performedBy: req.user._id,
      adminName: req.user.name,
      type: 'payment',
      targetMember: member.memberId,
    });

    res.status(201).json({ success: true, data: fine });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/fines/:id/pay — mark fine as paid
exports.markPaid = async (req, res) => {
  try {
    const fine = await Fine.findByIdAndUpdate(
      req.params.id,
      { isPaid: true, paidDate: new Date() },
      { new: true }
    );
    if (!fine) return res.status(404).json({ success: false, message: 'Fine not found.' });

    await AdminLog.create({
      action: `Fine paid: ${fine.memberName} ₹${fine.amount}`,
      performedBy: req.user._id,
      adminName: req.user.name,
      type: 'payment',
      targetMember: fine.memberMemberId,
    });

    res.json({ success: true, data: fine });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/fines/:id/unpay — mark fine as unpaid
exports.markUnpaid = async (req, res) => {
  try {
    const fine = await Fine.findByIdAndUpdate(
      req.params.id,
      { isPaid: false, paidDate: null },
      { new: true }
    );
    if (!fine) return res.status(404).json({ success: false, message: 'Fine not found.' });
    res.json({ success: true, data: fine });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/fines/:id
exports.deleteFine = async (req, res) => {
  try {
    const fine = await Fine.findById(req.params.id);
    if (!fine) return res.status(404).json({ success: false, message: 'Fine not found.' });
    await fine.deleteOne();
    res.json({ success: true, message: 'Fine deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};