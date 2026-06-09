const express = require('express');
const router = express.Router();
const { getTransactions, addTransaction, deleteTransaction } = require('../controllers/transactionController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);
router.get('/', getTransactions);
router.post('/', adminOnly, addTransaction);
router.delete('/:id', adminOnly, deleteTransaction);

module.exports = router;
