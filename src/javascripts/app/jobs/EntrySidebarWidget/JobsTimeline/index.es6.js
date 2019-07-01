import React from 'react';
import PropTypes from 'prop-types';

import Job from './Job.es6';
import { TextLink } from '@contentful/forma-36-react-components';

import { JobsStateLink } from 'app/jobs/JobsPageLink.es6';

const JobsTimeline = ({ environmentId, jobs, onCancel }) => (
  <div>
    <ul>
      {jobs.map(job => (
        <Job
          id={job.sys.id}
          key={job.action}
          action={job.action}
          scheduledAt={job.scheduledAt}
          status={job.status}
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
  jobs: PropTypes.array.isRequired,
  onCancel: PropTypes.func.isRequired,
  environmentId: PropTypes.string.isRequired
};

export default JobsTimeline;
