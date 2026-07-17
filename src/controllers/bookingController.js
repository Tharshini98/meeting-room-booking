const mongoose = require('mongoose');
const bookingService = require('../services/bookingService');
const { NotFoundError } = require('../utils/errors');
const { validateCreateBookingInput, validateListBookingsQuery } = require('../utils/validators');

function assertValidRoomId(roomId) {
  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    throw new NotFoundError(`Room not found: ${roomId}`);
  }
}

async function createBooking(req, res) {
  const { start, end } = validateCreateBookingInput(req.body);
  assertValidRoomId(req.body.roomId);

  const idempotencyKey = req.get('Idempotency-Key') || undefined;

  const { booking, replay } = await bookingService.createBookingIdempotent({
    roomId: req.body.roomId,
    title: req.body.title,
    organizerEmail: req.body.organizerEmail,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    start,
    end,
    idempotencyKey,
  });

  res.status(replay ? 200 : 201).json(booking);
}

async function listBookings(req, res) {
  const filters = validateListBookingsQuery(req.query);
  if (filters.roomId) assertValidRoomId(filters.roomId);
  const result = await bookingService.listBookings(filters);
  res.status(200).json(result);
}

async function cancelBooking(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new NotFoundError(`Booking not found: ${req.params.id}`);
  }
  const booking = await bookingService.cancelBooking(req.params.id);
  res.status(200).json(booking);
}

module.exports = { createBooking, listBookings, cancelBooking };