const Member = require('../models/Member');
const Transaction = require('../models/Transaction');
const AdminLog = require('../models/AdminLog');

// GET /api/reports/export-csv
exports.exportCSV = async (req, res) => {
  try {
    const members = await Member.find().select('-password');
    const rows = [
      ['ID', 'Name', 'Phone', 'Email', 'Address', 'Loan Status', 'Loan Amount', 'Interest %', 'Monthly Interest', 'Interest Paid', 'Balance', 'Invested', 'Loan Start', 'Notes'].join(','),
      ...members.map(m => [
        m.memberId, `"${m.name}"`, m.phone, m.email, `"${m.address || ''}"`,
        m.loanActive ? 'Active' : 'Closed', m.loanAmount, m.interestPct + '%',
        m.monthlyInterest, m.interestPaid, m.loanActive ? m.balance : 0,
        m.invested, m.loanStart ? m.loanStart.toISOString().slice(0, 10) : '',
        `"${m.notes || ''}"`
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=fingroup_members.csv');
    res.send(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/activity
exports.getActivityLog = async (req, res) => {
  try {
    const logs = await AdminLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const members = await Member.find().select('-password');
    const activeLoans = members.filter(m => m.loanActive);

    // Monthly interest collection trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const txns = await Transaction.find({ date: { $gte: start, $lte: end }, type: { $in: ['Interest', 'Principal+Interest', 'Full Closure'] } });
      monthlyTrend.push({
        month: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
        amount: txns.reduce((a, t) => a + t.amount, 0),
      });
    }

    res.json({
      success: true, data: {
        members: members.map(m => ({ id: m._id, memberId: m.memberId, name: m.name, loanAmount: m.loanAmount, invested: m.invested, interestPct: m.interestPct, interestPaid: m.interestPaid, balance: m.balance, loanActive: m.loanActive, color: m.color })),
        monthlyTrend,
        summary: {
          totalMembers: members.length,
          activeLoans: activeLoans.length,
          totalLoanBook: activeLoans.reduce((a, m) => a + m.loanAmount, 0),
          totalInvested: members.reduce((a, m) => a + m.invested, 0),
          totalCollected: members.reduce((a, m) => a + m.interestPaid, 0),
          totalBalance: activeLoans.reduce((a, m) => a + m.balance, 0),
          monthlyIncome: activeLoans.reduce((a, m) => a + m.monthlyInterest, 0),
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
