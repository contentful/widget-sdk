import moment from 'moment-timezone';

export function formatScheduledAtDate({ date, time, timezone }) {
  const scheduledDate = moment(`${date} ${time}`, 'YYYY-MM-DD HH:mm');
  const scheduledOffset = moment.tz(scheduledDate, timezone).utcOffset();
  return scheduledDate.utcOffset(scheduledOffset, true).toISOString(true);
}
