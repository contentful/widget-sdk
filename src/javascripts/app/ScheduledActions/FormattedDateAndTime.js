import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

/**
 * @param {Date|string} date A valid constructor argument for moment()
 * @param {boolean=} short Render only Today/Tomorrow/Yesterday if valid. Defaults to false
 */
export function formatDate(date, short) {
  switch (moment().startOf('day').diff(moment(date).startOf('day'), 'days')) {
    case 0:
      return short ? 'Today' : `Today, ${moment(date).format('DD MMM YYYY')}`;
    case -1:
      return short ? 'Tomorrow' : `Tomorrow, ${moment(date).format('DD MMM YYYY')}`;
    case 1:
      return short ? 'Yesterday' : `Yesterday, ${moment(date).format('DD MMM YYYY')}`;
    default:
      return moment(date).format('ddd, DD MMM YYYY');
  }
}

/**
 * Returns the time portion of a date in the local time in the format H:MM AM/PM
 *
 * == Examples
 * * `T15:36:45.000Z` => 3:36 PM (if in +0:00 offset)
 *
 * @param {Date|string} date A valid constructor argument for moment()
 */
export function formatTime(date) {
  return moment.utc(date).local().format('h:mm A');
}

export function formatDateAndTime(date, short) {
  return `${formatDate(date, short)} at ${formatTime(date)}`;
}

/**
 * Returns a standard, F36 formatted `time` element with no extra CSS applied by default
 */
export function DateTime(props) {
  const { date, className, short } = props;

  return (
    <time
      className={className}
      dateTime={date}
      title={`${formatDate(date, short)} at ${formatTime(date)}`}>
      {formatDateAndTime(date, '')}
    </time>
  );
}

DateTime.propTypes = {
  date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
  /**
   * If true renders only Today, Tomorrow etc for the date portion if within the relative time range. Defaults to false
   */
  short: PropTypes.bool,
  className: PropTypes.string,
};
