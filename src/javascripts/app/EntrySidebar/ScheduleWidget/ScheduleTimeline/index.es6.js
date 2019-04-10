import React from 'react';
import PropTypes from 'prop-types';

import Schedule, { schedulePropTypes } from './Schedule.es6';
import CurrentStatus from './CurrentStatus.es6';

const ScheduleTimeline = ({ schedules }) => (
  <ul>
    <CurrentStatus status={'draft'} />
    {schedules.map(schedule => (
      <Schedule
        key={schedule.actionType}
        actionType={schedule.actionType}
        scheduledAt={schedule.scheduledAt}
        status={schedule.status}
      />
    ))}
  </ul>
);

ScheduleTimeline.propTypes = {
  schedules: PropTypes.arrayOf(PropTypes.shape(schedulePropTypes))
};

export default ScheduleTimeline;
