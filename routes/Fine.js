const express = require('express');
const router = express.Router();
const {
  getAll,
  getMemberFines,
  addFine,
  markPaid,
  markUnpaid,
  deleteFine,
} = require('../controllers/fineController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.get('/', getAll);
router.get('/member/:memberId', getMemberFines);
router.post('/', adminOnly, addFine);
router.put('/:id/pay', adminOnly, markPaid);
router.put('/:id/unpay', adminOnly, markUnpaid);
router.delete('/:id', adminOnly, deleteFine);

module.exports = router;