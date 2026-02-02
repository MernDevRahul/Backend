const express = require('express');
const { createUser, login, logout, fetchOwner, sendOtp, verifyOtp } = require('../controllers/auth.controller');
const { protect } = require('../middleware/protect');
const router = express.Router();
// Login
router.post('/login', login);

// send Otp
router.post('/send-otp', sendOtp)

// Verify Otp
router.post('/verify-otp', verifyOtp)

// Logout
router.post('/logout', logout);

// Fetch Owner
router.get('/fetch-owner',protect(["owner"]),fetchOwner);

module.exports = router;