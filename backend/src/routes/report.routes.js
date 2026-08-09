const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/report.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.use(protect);
router.use(authorize('OWNER'));

router.get('/dashboard', getDashboardStats);

module.exports = router;
