import React from 'react';
import ScheduleTimeline from './ScheduleTimeline/index.es6';

export default () => {
  return (
    <ScheduleTimeline
      schedules={[
        { scheduledAt: 1554362433632, actionType: 'publish', status: 'pending' },
        { scheduledAt: 1554362433632, actionType: 'publish', status: 'pending' }
      ]}
    />
  );
};
