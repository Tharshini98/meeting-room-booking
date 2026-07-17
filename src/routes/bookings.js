const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.post('/', asyncHandler(bookingController.createBooking));
router.get('/', asyncHandler(bookingController.listBookings));
router.post('/:id/cancel', asyncHandler(bookingController.cancelBooking));

module.exports = router;