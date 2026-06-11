const mongoose = require('mongoose');

const fineSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  memberName: { type: String },
  memberMemberId: { type: String },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  fineType: { type: String, enum: ['Late Fine', 'Investment Late Fine', 'Loan Overdue Fine', 'Other'], default: 'Other' },
  date: { type: Date, default: Date.now },
  isPaid: { type: Boolean, default: false },
  paidDate: { type: Date },
  note: { type: String },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Fine', fineSchema);