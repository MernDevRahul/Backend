const express = require('express');
const { protect } = require('../middleware/protect');
const { createUser } = require('../controllers/user.controller');

const router = express.Router();

router.post('/create-user',protect(["owner","client","admin"]),createUser);


module.exports = router;