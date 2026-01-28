const express = require('express');
const { createUser, login, logout } = require('../controllers/auth.controller');
const router = express.Router();

// Register / create user
router.post('/create-user', createUser);

// Login
router.post('/login', login);

// Logout
router.post('/logout', logout);

module.exports = router;