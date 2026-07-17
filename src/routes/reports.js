const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const reportController = require('../controllers/reportController');

const router = express.Router();

router.get('/room-utilization', asyncHandler(reportController.roomUtilization));

module.exports = router;