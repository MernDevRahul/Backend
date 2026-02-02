const express = require('express');
const { protect } = require('../middleware/protect');
const { getAllClients } = require('../controllers/client.controller');
const router = express.Router();

router.get('/fetch-all-clients',protect(["owner"]),getAllClients)


module.exports = router;