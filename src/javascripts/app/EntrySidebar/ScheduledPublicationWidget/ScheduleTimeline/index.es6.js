import React from 'react';
import Schedule from './Schedule.es6';
import PropTypes from 'prop-types';

const ScheduleTimeline = ({ schedules }) => (
  <ul>
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
  schedules: PropTypes.arrayOf(
    PropTypes.shape({
      actionType: PropTypes.string,
      scheduledAt: PropTypes.string,
      status: PropTypes.oneOf(['pending', 'cancelled', 'success', 'error'])
    })
  )
};

export default ScheduleTimeline;
