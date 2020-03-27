import moment from 'moment';

const ZONE_RX = /(Z|[+-]\d{2}[:+]?\d{2})$/;

function startOfToday(format) {
  return moment().set({ hours: 0, minutes: 0 }).format(format);
}

/**
 * @ngdoc method
 * @name widget/datetime/data#userInputFromDatetime
 * @description
 * Create the user input object from the field value.
 *
 * @param {string} datetime
 * @param {boolean} use12hClock
 * @returns {DateTimeInput}
 */
export function userInputFromDatetime(datetimeString, use12hClock) {
  const datetime = fieldValueToMoment(datetimeString);

  if (datetime) {
    const timeFormat = use12hClock ? 'hh:mm' : 'HH:mm';
    return {
      date: datetime,
      time: datetime.format(timeFormat),
      ampm: datetime.format('A'),
      utcOffset: datetime.format('Z'),
    };
  } else {
    return {
      ampm: startOfToday('A'),
      utcOffset: startOfToday('Z'),
    };
  }
}

function fieldValueToMoment(datetimeString) {
  if (!datetimeString) {
    return null;
  }

  const datetime = moment(datetimeString);
  if (ZONE_RX.test(datetimeString)) {
    datetime.utcOffset(datetimeString);
  }
  return datetime;
}
