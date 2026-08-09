const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/restaurant.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.use(protect);

// Get profile is accessible to all authenticated staff
router.get('/profile', getProfile);

// Only owner can update the restaurant profile
router.put('/profile', authorize('OWNER'), updateProfile);

module.exports = router;
