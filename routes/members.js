const express = require('express');
const router = express.Router();
const { getAllMembers, getMember, createMember, updateMember, deleteMember, setGlobalInterest, setMemberInterest, getStats } = require('../controllers/memberController');
const { protect, adminOnly, memberSelf } = require('../middleware/auth');

router.use(protect);

router.get('/stats/summary', adminOnly, getStats);
router.put('/interest/global', adminOnly, setGlobalInterest);

router.get('/', adminOnly, getAllMembers);
router.post('/', adminOnly, createMember);

router.get('/:id', memberSelf, getMember);
router.put('/:id', adminOnly, updateMember);
router.delete('/:id', adminOnly, deleteMember);
router.put('/:id/interest', adminOnly, setMemberInterest);

module.exports = router;
