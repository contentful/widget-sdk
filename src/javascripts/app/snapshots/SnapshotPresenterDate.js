import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import { userInputFromDatetime } from './dateUtils';

const MODE_DATE = 'date';
const MODE_TIMEZ = 'timeZ';

const SnapshotPresenterDate = ({ settings, value }) => {
  const { date, time, utcOffset } = userInputFromDatetime(value);
  const mode = settings.format || MODE_DATE;

  let dateString = moment(date).format('dddd, MMMM Do YYYY');
  if (mode === MODE_DATE) return <span data-test-id="snapshot-presenter-date">{dateString}</span>;

  const is24HourTimezone = parseInt(settings.ampm, 10) === 24;
  if (is24HourTimezone) {
    dateString += `, ${time}`;
  } else {
    const [hour, minute] = time.split(':');
    const longDate = moment().hour(hour).minute(minute).format('LT');
    dateString += `, ${longDate}`;
  }

  if (mode === MODE_TIMEZ) {
    dateString += `, UTC${utcOffset}`;
  }

  return <span data-test-id="snapshot-presenter-date">{dateString}</span>;
};

SnapshotPresenterDate.propTypes = {
  settings: PropTypes.shape({
    format: PropTypes.string,
    ampm: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }).isRequired,
  value: PropTypes.string.isRequired,
};

SnapshotPresenterDate.defaultProps = {
  settings: {},
};

export default SnapshotPresenterDate;
