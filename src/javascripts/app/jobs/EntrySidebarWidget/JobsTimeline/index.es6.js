import React from 'react';
import PropTypes from 'prop-types';

import Job from './Job.es6';
import { TextLink } from '@contentful/forma-36-react-components';

import { JobsStateLink } from 'app/jobs/JobsPageLink.es6';

const JobsTimeline = ({ environmentId, jobs, onCancel, isReadOnly }) => (
  <div>
    <header className="entity-sidebar__header">
      <h2 className="entity-sidebar__heading">Schedule</h2>
    </header>
    <ul>
      {jobs.map(job => (
        <Job
          id={job.sys.id}
          key={job.action}
          action={job.action}
          scheduledAt={job.scheduledAt}
          status={job.status}
          onCancel={onCancel}
          isReadOnly={isReadOnly}
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
  environmentId: PropTypes.string.isRequired,
  isReadOnly: PropTypes.bool.isRequired
};

export default JobsTimeline;
