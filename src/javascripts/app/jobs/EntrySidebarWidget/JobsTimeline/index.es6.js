import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import { css } from 'emotion';

import Job from './Job.es6';
import { TextLink, Tag, Subheading, List } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { JobsStateLink } from 'app/jobs/JobsPageLink.es6';

const styles = {
  alphaSideBarHeading: css({
    display: 'flex'
  }),
  alphaTag: css({
    marginLeft: 'auto'
  }),
  jobList: css({
    marginBottom: tokens.spacingM
  })
};

const JobsTimeline = ({ isMasterEnvironment, jobs, onCancel, isReadOnly }) => (
  <div>
    <header className="entity-sidebar__header">
      <Subheading className={cn(styles.alphaSideBarHeading, 'entity-sidebar__heading')}>
        Schedule <Tag className={styles.alphaTag}>Alpha</Tag>
      </Subheading>
    </header>
    <List className={styles.jobList}>
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
    </List>
    <JobsStateLink isMasterEnvironment={isMasterEnvironment}>
      {({ getHref }) => (
        <TextLink linkType="muted" href={getHref()}>
          View all scheduled entries
        </TextLink>
      )}
    </JobsStateLink>
  </div>
);

JobsTimeline.propTypes = {
  jobs: PropTypes.array.isRequired,
  onCancel: PropTypes.func.isRequired,
  isMasterEnvironment: PropTypes.bool.isRequired,
  isReadOnly: PropTypes.bool.isRequired
};

export default JobsTimeline;
