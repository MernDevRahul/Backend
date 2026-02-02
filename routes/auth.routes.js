const express = require('express');
const { createUser, login, logout, fetchOwner } = require('../controllers/auth.controller');
const { protect } = require('../middleware/protect');
const router = express.Router();
// Login
router.post('/login', login);

// Logout
router.post('/logout', logout);

// Fetch Owner
router.get('/fetch-owner',protect(["owner"]),fetchOwner);

module.exports = router;