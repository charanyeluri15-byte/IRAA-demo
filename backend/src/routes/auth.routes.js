const express = require('express');
const router = express.Router();
const { registerOwner, loginUser, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/register', registerOwner);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

module.exports = router;
