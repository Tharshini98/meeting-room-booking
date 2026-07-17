const { ValidationError } = require('./errors');

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function validateCreateRoomInput(body) {
  const errors = [];
  if (!isNonEmptyString(body?.name)) errors.push('name is required and must be a non-empty string');
  if (!Number.isInteger(body?.capacity) || body.capacity < 1) {
    errors.push('capacity is required and must be an integer >= 1');
  }
  if (!Number.isInteger(body?.floor)) errors.push('floor is required and must be an integer');
  if (body?.amenities !== undefined) {
    if (!Array.isArray(body.amenities) || body.amenities.some((a) => typeof a !== 'string')) {
      errors.push('amenities must be an array of strings');
    }
  }
  if (body?.timezone !== undefined && !isNonEmptyString(body.timezone)) {
    errors.push('timezone must be a non-empty string (IANA timezone name)');
  }
  if (errors.length) throw new ValidationError('Invalid room payload', errors);
}

function validateListRoomsQuery(query) {
  const errors = [];
  let minCapacity;
  if (query.minCapacity !== undefined) {
    minCapacity = Number(query.minCapacity);
    if (!Number.isFinite(minCapacity) || minCapacity < 0) {
      errors.push('minCapacity must be a non-negative number');
    }
  }
  if (errors.length) throw new ValidationError('Invalid query parameters', errors);
  return { minCapacity, amenity: query.amenity };
}

function validateCreateBookingInput(body) {
  const errors = [];
  if (body?.roomId === undefined || body?.roomId === null || body?.roomId === '') {
    errors.push('roomId is required');
  }
  if (!isNonEmptyString(body?.title)) errors.push('title is required and must be a non-empty string');
  if (!isNonEmptyString(body?.organizerEmail) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.organizerEmail)) {
    errors.push('organizerEmail is required and must be a valid email');
  }

  let start;
  let end;
  if (!isNonEmptyString(body?.startTime) || Number.isNaN((start = new Date(body.startTime)).getTime())) {
    errors.push('startTime is required and must be a valid ISO-8601 date-time');
  }
  if (!isNonEmptyString(body?.endTime) || Number.isNaN((end = new Date(body.endTime)).getTime())) {
    errors.push('endTime is required and must be a valid ISO-8601 date-time');
  }

  if (errors.length) throw new ValidationError('Invalid booking payload', errors);

  if (!(start < end)) {
    throw new ValidationError('Invalid booking payload', ['startTime must be before endTime']);
  }

  const durationMinutes = (end.getTime() - start.getTime()) / (60 * 1000);
  if (durationMinutes < 15 || durationMinutes > 240) {
    throw new ValidationError('Invalid booking payload', [
      'booking duration must be between 15 minutes and 4 hours',
    ]);
  }

  return { start, end };
}

function validateListBookingsQuery(query) {
  const errors = [];
  let from;
  let to;
  if (query.from !== undefined) {
    from = new Date(query.from);
    if (Number.isNaN(from.getTime())) errors.push('from must be a valid ISO-8601 date-time');
  }
  if (query.to !== undefined) {
    to = new Date(query.to);
    if (Number.isNaN(to.getTime())) errors.push('to must be a valid ISO-8601 date-time');
  }
  let limit = query.limit !== undefined ? Number(query.limit) : 20;
  let offset = query.offset !== undefined ? Number(query.offset) : 0;
  if (!Number.isInteger(limit) || limit < 1 || limit > 200) errors.push('limit must be an integer between 1 and 200');
  if (!Number.isInteger(offset) || offset < 0) errors.push('offset must be a non-negative integer');

  if (errors.length) throw new ValidationError('Invalid query parameters', errors);
  return { roomId: query.roomId, from, to, limit, offset };
}

function validateUtilizationQuery(query) {
  const errors = [];
  if (!isNonEmptyString(query.from)) errors.push('from is required (ISO-8601 date-time)');
  if (!isNonEmptyString(query.to)) errors.push('to is required (ISO-8601 date-time)');

  const from = new Date(query.from);
  const to = new Date(query.to);
  if (query.from && Number.isNaN(from.getTime())) errors.push('from must be a valid ISO-8601 date-time');
  if (query.to && Number.isNaN(to.getTime())) errors.push('to must be a valid ISO-8601 date-time');
  if (!errors.length && !(from < to)) errors.push('from must be before to');

  if (errors.length) throw new ValidationError('Invalid query parameters', errors);
  return { from, to };
}

module.exports = {
  validateCreateRoomInput,
  validateListRoomsQuery,
  validateCreateBookingInput,
  validateListBookingsQuery,
  validateUtilizationQuery,
};