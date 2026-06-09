require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./db');

const User = require('../models/User');
const Member = require('../models/Member');
const Transaction = require('../models/Transaction');
const AdminLog = require('../models/AdminLog');

const seed = async () => {
  await connectDB();

  await User.deleteMany({});
  await Member.deleteMany({});
  await Transaction.deleteMany({});
  await AdminLog.deleteMany({});

  console.log('🧹 Cleared existing data');

  const adminPass = await bcrypt.hash('admin123', 10);
  const admin = await User.create({
    name: 'Shiva Prasad P K',
    email: 'admin@fingroup.com',
    password: adminPass,
    role: 'admin',
    phone: '9876500000',
  });
  console.log('👤 Admin created: admin@fingroup.com / admin123');

  const memberData = [
    // Old 6 members
    { memberId: 'MEM001', name: 'Sudeep',        phone: '9876541001', email: 'sudeep@gmail.com',        color: '#3b82f6' },
    { memberId: 'MEM002', name: 'Adarsh Ponnu',  phone: '9876541002', email: 'adarshponnu@gmail.com',   color: '#8b5cf6' },
    { memberId: 'MEM003', name: 'Adarsh MT',     phone: '9876541003', email: 'adarshmt@gmail.com',      color: '#10b981' },
    { memberId: 'MEM004', name: 'Shyam',         phone: '9876541004', email: 'shyam@gmail.com',         color: '#f59e0b' },
    { memberId: 'MEM005', name: 'Sharath',       phone: '9876541005', email: 'sharath@gmail.com',       color: '#ef4444' },
    { memberId: 'MEM006', name: 'Abith',         phone: '9876541006', email: 'abith@gmail.com',         color: '#06b6d4' },
    // New 7 members
    { memberId: 'MEM007', name: 'Shiva Prasad P K', phone: '9876541007', email: 'shivaprasad@gmail.com', color: '#ec4899' },
    { memberId: 'MEM008', name: 'Pranav Prakash',   phone: '9876541008', email: 'pranavprakash@gmail.com', color: '#a855f7' },
    { memberId: 'MEM009', name: 'Sharin',           phone: '9876541009', email: 'sharin@gmail.com',       color: '#14b8a6' },
    { memberId: 'MEM010', name: 'Aswin Asok',       phone: '9876541010', email: 'aswinasok@gmail.com',    color: '#f97316' },
    { memberId: 'MEM011', name: 'Aswin Prabakar',   phone: '9876541011', email: 'aswinprabakar@gmail.com',color: '#84cc16' },
    { memberId: 'MEM012', name: 'Rajeesh',          phone: '9876541012', email: 'rajeesh@gmail.com',      color: '#0ea5e9' },
    { memberId: 'MEM013', name: 'Rojin',            phone: '9876541013', email: 'rojin@gmail.com',        color: '#e11d48' },
  ].map(m => ({
    ...m,
    password: 'pass1234',
    address: 'Kerala',
    loanActive: false,
    loanAmount: 0,
    loanStart: new Date('2024-01-01'),
    interestPct: 12,
    interestPaid: 0,
    invested: 36000,
    notes: 'Active member.',
  }));

  for (const md of memberData) {
    const hashedPass = await bcrypt.hash(md.password, 10);
    const member = await Member.create({ ...md, password: hashedPass });
    await User.create({
      name: md.name,
      email: md.email,
      password: hashedPass,
      role: 'member',
      phone: md.phone,
      memberId: member._id,
    });
    console.log(`✅ ${md.memberId}  ${md.name.padEnd(20)} — Invested: ₹36,000`);
  }

  await AdminLog.create({
    action: 'Database seeded with all 13 members',
    performedBy: admin._id,
    adminName: admin.name,
    type: 'system',
  });

  console.log('\n🎉 Database seeded successfully! 13 members total');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:   admin@fingroup.com / admin123');
  console.log('Members: MEM001 to MEM013   / pass1234');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
