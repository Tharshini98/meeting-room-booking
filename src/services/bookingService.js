const crypto = require('crypto');
const mongoose = require('mongoose');
const dayjs = require('dayjs');

const Room = require('../models/Room');
const Booking = require('../models/Booking');
const IdempotencyKey = require('../models/IdempotencyKey');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/errors');
const { isWithinBusinessWindow } = require('../utils/timeUtils');

const CANCEL_GRACE_PERIOD_MS = 60 * 60 * 1000; // 1 hour
const IDEMPOTENCY_POLL_ATTEMPTS = 5;
const IDEMPOTENCY_POLL_DELAY_MS = 150;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hashRequestPayload(payload) {
  const canonical = JSON.stringify({
    roomId: String(payload.roomId),
    title: payload.title,
    organizerEmail: payload.organizerEmail.toLowerCase(),
    startTime: new Date(payload.startTime).toISOString(),
    endTime: new Date(payload.endTime).toISOString(),
  });
  return crypto.createHash('sha256').update(canonical).digest('hex');
}


async function createBookingCore({ roomId, title, organizerEmail, start, end }) {
  const room = await Room.findById(roomId);
  if (!room) {
    throw new NotFoundError(`Room not found: ${roomId}`);
  }

  if (!isWithinBusinessWindow(start, end, room.timezone)) {
    throw new ValidationError('Invalid booking payload', [
      `bookings must fall on a single weekday (Mon-Fri) between 08:00 and 20:00 in the room's local time (${room.timezone})`,
    ]);
  }

  const session = await mongoose.startSession();
  try {
    let created;
    await session.withTransaction(async () => {
      
      await Room.updateOne({ _id: roomId }, { $inc: { bookingLockVersion: 1 } }, { session });

      const overlap = await Booking.findOne({
        roomId,
        status: 'confirmed',
        startTime: { $lt: end },
        endTime: { $gt: start },
      }).session(session);

      if (overlap) {
        throw new ConflictError('Booking overlaps with an existing confirmed booking for this room', {
          conflictingBookingId: overlap._id.toString(),
        });
      }

      const docs = await Booking.create(
        [{ roomId, title, organizerEmail, startTime: start, endTime: end, status: 'confirmed' }],
        { session }
      );
      created = docs[0];
    });
    return created;
  } finally {
    await session.endSession();
  }
}


async function createBookingIdempotent(payload) {
  const { roomId, title, organizerEmail, idempotencyKey } = payload;
  const { start, end } = payload; // already validated/parsed by controller

  if (!idempotencyKey) {
    const booking = await createBookingCore({ roomId, title, organizerEmail, start, end });
    return { booking, replay: false };
  }

  const requestHash = hashRequestPayload(payload);
  const orgKey = organizerEmail.toLowerCase();

  for (let attempt = 0; attempt < IDEMPOTENCY_POLL_ATTEMPTS; attempt += 1) {
    let owns = false;
    let record;
    try {
      record = await IdempotencyKey.create({
        idempotencyKey,
        organizerEmail: orgKey,
        requestHash,
        status: 'in_progress',
      });
      owns = true;
    } catch (err) {
      if (err.code !== 11000) throw err;
      record = await IdempotencyKey.findOne({ idempotencyKey, organizerEmail: orgKey });
      if (!record) continue; // raced with a delete/expiry; retry loop
    }

    if (owns) {
      try {
        const booking = await createBookingCore({ roomId, title, organizerEmail, start, end });
        await IdempotencyKey.updateOne({ _id: record._id }, { status: 'completed', bookingId: booking._id });
        return { booking, replay: false };
      } catch (err) {
        await IdempotencyKey.updateOne({ _id: record._id }, { status: 'failed' });
        throw err;
      }
    }

    
    if (record.requestHash !== requestHash) {
      throw new ValidationError('Invalid booking payload', [
        'Idempotency-Key was already used with a different request payload',
      ]);
    }

    if (record.status === 'completed') {
      const booking = await Booking.findById(record.bookingId);
      if (booking) return { booking, replay: true };
      
    }

    if (record.status === 'failed') {
      
      const reclaimed = await IdempotencyKey.findOneAndUpdate(
        { _id: record._id, status: 'failed' },
        { status: 'in_progress' },
        { new: true }
      );
      if (reclaimed) {
        try {
          const booking = await createBookingCore({ roomId, title, organizerEmail, start, end });
          await IdempotencyKey.updateOne({ _id: reclaimed._id }, { status: 'completed', bookingId: booking._id });
          return { booking, replay: false };
        } catch (err) {
          await IdempotencyKey.updateOne({ _id: reclaimed._id }, { status: 'failed' });
          throw err;
        }
      }
      
    }

    
    await sleep(IDEMPOTENCY_POLL_DELAY_MS);
  }

  throw new ConflictError('A request with this Idempotency-Key is still in progress. Please retry shortly.');
}

async function listBookings({ roomId, from, to, limit, offset }) {
  const filter = {};
  if (roomId) filter.roomId = roomId;
  if (from || to) {
    filter.startTime = {};
    if (from) filter.startTime.$gte = from;
    if (to) filter.startTime.$lte = to;
  }

  const [items, total] = await Promise.all([
    Booking.find(filter).sort({ startTime: 1 }).skip(offset).limit(limit),
    Booking.countDocuments(filter),
  ]);

  return { items, total, limit, offset };
}

async function cancelBooking(id) {
  const booking = await Booking.findById(id);
  if (!booking) {
    throw new NotFoundError(`Booking not found: ${id}`);
  }

  if (booking.status === 'cancelled') {
    return booking; 
  }

  const cutoff = dayjs(booking.startTime).subtract(CANCEL_GRACE_PERIOD_MS, 'millisecond');
  if (dayjs().isAfter(cutoff)) {
    throw new ValidationError('Invalid booking payload', [
      'booking can only be cancelled up to 1 hour before startTime',
    ]);
  }

  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  await booking.save();
  return booking;
}

module.exports = {
  createBookingCore,
  createBookingIdempotent,
  listBookings,
  cancelBooking,
  hashRequestPayload,
};