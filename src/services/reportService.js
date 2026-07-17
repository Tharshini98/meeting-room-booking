const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { businessHoursInRange, overlapHours } = require('../utils/timeUtils');


async function getRoomUtilization({ from, to }) {
  const rooms = await Room.find();

  const results = await Promise.all(
    rooms.map(async (room) => {
      const bookings = await Booking.find({
        roomId: room._id,
        status: 'confirmed',
        startTime: { $lt: to },
        endTime: { $gt: from },
      });

      const totalBookingHours = bookings.reduce(
        (sum, b) => sum + overlapHours(b.startTime, b.endTime, from, to),
        0
      );

      const totalBusinessHours = businessHoursInRange(from, to, room.timezone);
      const utilizationPercent = totalBusinessHours > 0 ? totalBookingHours / totalBusinessHours : 0;

      return {
        roomId: room._id.toString(),
        roomName: room.name,
        totalBookingHours: Math.round(totalBookingHours * 100) / 100,
        utilizationPercent: Math.round(utilizationPercent * 10000) / 10000,
      };
    })
  );

  return results;
}

module.exports = { getRoomUtilization };