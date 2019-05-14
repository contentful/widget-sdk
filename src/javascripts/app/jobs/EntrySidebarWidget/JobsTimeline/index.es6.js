import React from 'react';
import PropTypes from 'prop-types';

import Job, { propTypes as jobPropTypes } from './Job.es6';
import CurrentStatus from './CurrentStatus.es6';

const JobsTimeline = ({ jobs }) => (
  <ul>
    <CurrentStatus status={'draft'} />
    {jobs.map(schedule => (
      <Job
        key={schedule.actionType}
        actionType={schedule.actionType}
        scheduledAt={schedule.scheduledAt}
        status={schedule.status}
      />
    ))}
  </ul>
);

JobsTimeline.propTypes = {
  jobs: PropTypes.arrayOf(PropTypes.shape(jobPropTypes))
};

export default JobsTimeline;
