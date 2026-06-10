const express = require('express');
const router = express.Router();
const { getAll, getMemberEntries, addEntry, deleteEntry } = require('../controllers/samruthyController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.get('/', getAll);
router.get('/member/:memberId', getMemberEntries);
router.post('/', adminOnly, addEntry);
router.delete('/:id', adminOnly, deleteEntry);

module.exports = router;