const express = require('express');
const router = express.Router();
const { exportCSV, getActivityLog, getAnalytics } = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);
router.get('/export-csv', exportCSV);
router.get('/activity', getActivityLog);
router.get('/analytics', getAnalytics);

module.exports = router;
