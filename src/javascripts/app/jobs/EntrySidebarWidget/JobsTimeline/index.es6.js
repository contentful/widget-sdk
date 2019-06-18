import React from 'react';
import PropTypes from 'prop-types';

import Job, { propTypes as jobPropTypes } from './Job.es6';
import { TextLink } from '@contentful/forma-36-react-components';

import { JobsStateLink } from 'app/jobs/JobsPageLink.es6';

const JobsTimeline = ({ environmentId, jobs, onCancel }) => (
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
    <JobsStateLink environmentId={environmentId}>
      {({ getHref }) => (
        <TextLink linkType="muted" className="f36-margin-top--m" href={getHref()}>
          View all scheduled entries
        </TextLink>
      )}
    </JobsStateLink>
  </div>
);

JobsTimeline.propTypes = {
  jobs: PropTypes.arrayOf(PropTypes.shape(jobPropTypes)),
  onCancel: PropTypes.func.isRequired,
  environmentId: PropTypes.string.isRequired
};

export default JobsTimeline;
