const mongoose = require('mongoose');

const samruthySchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  memberName: { type: String },
  memberMemberId: { type: String },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  note: { type: String },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Samruthy', samruthySchema);