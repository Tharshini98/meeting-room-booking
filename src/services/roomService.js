const Room = require('../models/Room');
const { ValidationError } = require('../utils/errors');

async function createRoom({ name, capacity, floor, amenities, timezone }) {
  const nameLower = name.trim().toLowerCase();
  const existing = await Room.findOne({ nameLower });
  if (existing) {
    throw new ValidationError('Invalid room payload', [`room name "${name}" already exists (case-insensitive)`]);
  }

  const room = await Room.create({
    name: name.trim(),
    capacity,
    floor,
    amenities: amenities || [],
    timezone: timezone || 'UTC',
  });
  return room;
}

async function listRooms({ minCapacity, amenity }) {
  const filter = {};
  if (minCapacity !== undefined) filter.capacity = { $gte: minCapacity };
  if (amenity) filter.amenities = amenity;
  return Room.find(filter).sort({ createdAt: 1 });
}

async function getRoomById(id) {
  return Room.findById(id);
}

module.exports = { createRoom, listRooms, getRoomById };