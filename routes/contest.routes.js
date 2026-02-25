const express = require('express');
const { createContest } = require('../controllers/contest.controller');
const router = express.Router();

// create Contest
router.post('/create', createContest);

module.exports = router;