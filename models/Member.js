const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  memberId: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  address: { type: String },
  email: { type: String, required: true, lowercase: true },
  password: { type: String, required: true },
  color: { type: String, default: '#3b82f6' },
  profilePhoto: { type: String },

  // Loan
  loanActive: { type: Boolean, default: false },
  loanAmount: { type: Number, default: 0 },
  loanStart: { type: Date },
  interestPct: { type: Number, default: 12 },
  interestPaid: { type: Number, default: 0 },

  // Investment
  invested: { type: Number, default: 0 },

  notes: { type: String },
}, { timestamps: true });

// Virtual: monthly interest
memberSchema.virtual('monthlyInterest').get(function () {
  return Math.round(this.loanAmount * this.interestPct / 100 / 12);
});

// Virtual: months active
memberSchema.virtual('monthsActive').get(function () {
  if (!this.loanStart) return 0;
  const now = new Date();
  return Math.max(0,
    (now.getFullYear() - this.loanStart.getFullYear()) * 12 +
    (now.getMonth() - this.loanStart.getMonth())
  );
});

// Virtual: total accrued interest
memberSchema.virtual('accruedInterest').get(function () {
  return this.monthlyInterest * this.monthsActive;
});

// Virtual: balance
memberSchema.virtual('balance').get(function () {
  if (!this.loanActive) return 0;
  return Math.max(0, this.loanAmount + this.accruedInterest - this.interestPaid);
});

memberSchema.set('toJSON', { virtuals: true });
memberSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Member', memberSchema);
