import React from 'react';
import PropTypes from 'prop-types';

import Job, { propTypes as jobPropTypes } from './Job.es6';
import { TextLink } from '@contentful/forma-36-react-components';
import StateLink from 'app/common/StateLink.es6';

const JobsTimeline = ({ jobs, onCancel }) => (
  <div>
    <ul>
      {jobs.map(schedule => (
        <Job
          id={schedule.sys.id}
          key={schedule.action}
          action={schedule.action}
          scheduledAt={schedule.scheduledAt}
          status={schedule.status}
          onCancel={onCancel}
        />
      ))}
    </ul>
    <StateLink to="spaces.detail.environment.jobs">
      {({ getHref }) => (
        <TextLink linkType="muted" className="f36-margin-top--m" href={getHref()}>
          View all scheduled entries
        </TextLink>
      )}
    </StateLink>
  </div>
);

JobsTimeline.propTypes = {
  jobs: PropTypes.arrayOf(PropTypes.shape(jobPropTypes)),
  onCancel: PropTypes.func.isRequired
};

export default JobsTimeline;
