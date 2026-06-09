const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminName: { type: String },
  type: { type: String, enum: ['member', 'loan', 'payment', 'interest', 'system', 'auth'], default: 'system' },
  targetMember: { type: String },
  metadata: { type: Object },
}, { timestamps: true });

module.exports = mongoose.model('AdminLog', adminLogSchema);
