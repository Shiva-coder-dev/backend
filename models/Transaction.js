const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['Interest', 'Principal', 'Principal+Interest', 'Full Closure', 'Investment', 'Other'], default: 'Interest' },
  date: { type: Date, default: Date.now },
  note: { type: String },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
