const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const roomController = require('../controllers/roomController');

const router = express.Router();

router.post('/', asyncHandler(roomController.createRoom));
router.get('/', asyncHandler(roomController.listRooms));

module.exports = router;