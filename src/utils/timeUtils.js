const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter');
const minMax = require('dayjs/plugin/minMax');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(minMax);

const BUSINESS_START_HOUR = 8; // 08:00
const BUSINESS_END_HOUR = 20; // 20:00
const MS_PER_HOUR = 60 * 60 * 1000;

/**
 * Returns true if [start, end) â€” interpreted in the given IANA timezone â€”
 * falls entirely within a single business day: Monday-Friday, 08:00-20:00.
 * A booking that crosses midnight or spills outside the 08:00-20:00 window
 * is rejected, per spec ("Bookings only allowed Mon-Fri, 08:00-20:00").
 */
function isWithinBusinessWindow(start, end, tz) {
  const zStart = dayjs(start).tz(tz);
  const zEnd = dayjs(end).tz(tz);

  const isWeekday = (d) => d.day() >= 1 && d.day() <= 5; // 0=Sun..6=Sat

  if (!isWeekday(zStart) || !isWeekday(zEnd)) return false;
  // must stay on the same calendar day in room's local time
  if (!zStart.isSame(zEnd, 'day')) return false;

  const dayStart = zStart.hour(BUSINESS_START_HOUR).minute(0).second(0).millisecond(0);
  const dayEnd = zStart.hour(BUSINESS_END_HOUR).minute(0).second(0).millisecond(0);

  return zStart.isSameOrAfter(dayStart) && zEnd.isSameOrBefore(dayEnd);
}

/**
 * Total business hours (Mon-Fri, 08:00-20:00, in the given timezone)
 * contained within [from, to]. Walks day-by-day and intersects each day's
 * business window with [from, to].
 */
function businessHoursInRange(from, to, tz) {
  const rangeStart = dayjs(from).tz(tz);
  const rangeEnd = dayjs(to).tz(tz);
  if (!rangeStart.isBefore(rangeEnd)) return 0;

  let totalMs = 0;
  let cursor = rangeStart.startOf('day');

  while (cursor.isBefore(rangeEnd)) {
    if (cursor.day() >= 1 && cursor.day() <= 5) {
      const dayBizStart = cursor.hour(BUSINESS_START_HOUR).minute(0).second(0).millisecond(0);
      const dayBizEnd = cursor.hour(BUSINESS_END_HOUR).minute(0).second(0).millisecond(0);

      const overlapStart = dayjs.max(dayBizStart, rangeStart);
      const overlapEnd = dayjs.min(dayBizEnd, rangeEnd);

      if (overlapStart.isBefore(overlapEnd)) {
        totalMs += overlapEnd.diff(overlapStart);
      }
    }
    cursor = cursor.add(1, 'day');
  }

  return totalMs / MS_PER_HOUR;
}


function overlapHours(bookingStart, bookingEnd, from, to) {
  const start = dayjs.max(dayjs(bookingStart), dayjs(from));
  const end = dayjs.min(dayjs(bookingEnd), dayjs(to));
  if (!start.isBefore(end)) return 0;
  return end.diff(start) / MS_PER_HOUR;
}

module.exports = {
  isWithinBusinessWindow,
  businessHoursInRange,
  overlapHours,
  BUSINESS_START_HOUR,
  BUSINESS_END_HOUR,
};