import React from 'react';
import PropTypes from 'prop-types';
import { Tag, Tooltip, Paragraph } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import FormattedTime from 'app/ScheduledActions/EntrySidebarWidget/ScheduledActionsTimeline/FormattedTime';
import ScheduledActionActions from 'app/ScheduledActions/ScheduledActionAction';

import cn from 'classnames';
import { css } from 'emotion';

const styles = {
  statusTag: css({
    marginLeft: tokens.spacingM,
    zIndex: '0 !important'
  }),
  positiveColor: css({
    color: tokens.colorPositive
  }),
  secondaryColor: css({
    color: tokens.colorElementDarkest
  }),
  marginRightXS: css({
    marginRight: tokens.spacing2Xs
  }),
  paragraph: css({
    textAlign: 'center',
    color: tokens.colorElementDarkest
  }),
  time: {
    color: tokens.colorElementLight
  }
};

const actionColors = {
  [ScheduledActionActions.Publish]: 'positive',
  [ScheduledActionActions.Unpublish]: 'element'
};

const ScheduleTooltipContent = ({ job, jobsCount }) => {
  if (!job) {
    return null;
  }

  let colorPalette;
  switch (job.action.toLowerCase()) {
    case ScheduledActionActions.Publish:
      colorPalette = styles.positiveColor;
      break;
    case ScheduledActionActions.Unpublish:
      colorPalette = styles.secondaryColor;
      break;
    default:
      colorPalette = styles.secondaryColor;
  }

  return (
    <>
      <FormattedTime className={styles.time} time={job.scheduledAt} />
      <Tag
        tagType={actionColors[job.action.toLowerCase()]}
        testId="scheduled-publish-trigger"
        className={cn(styles.statusTag, ...colorPalette)}>
        {job.action.toUpperCase()}
      </Tag>
      {jobsCount > 1 && <Paragraph className={styles.paragraph}>+ {jobsCount - 1} more</Paragraph>}
    </>
  );
};

const Job = PropTypes.shape({
  action: PropTypes.oneOf(Object.keys(ScheduledActionActions).map(x => x.toLowerCase())).isRequired,
  sys: PropTypes.shape({
    id: PropTypes.string.isRequired
  }).isRequired,
  scheduledAt: PropTypes.string.isRequired
});

ScheduleTooltipContent.propTypes = {
  job: Job,
  jobsCount: PropTypes.number
};

const ScheduleTooltip = ({ job, jobsCount, jobs, filter, children }) => {
  const scheduledJobs =
    !job && Array.isArray(jobs) && typeof filter === 'function' ? jobs.filter(filter) : [];
  const sortedScheduledJobs = scheduledJobs.sort(
    (a, b) => new Date(a.scheduledAt) > new Date(b.scheduledAt)
  );
  const nextJob = job || sortedScheduledJobs[0];
  const pendingJobsCount = jobsCount || scheduledJobs.length;

  return nextJob ? (
    <Tooltip
      place="top"
      testId={nextJob.sys.id}
      containerElement="div"
      content={<ScheduleTooltipContent job={nextJob} jobsCount={pendingJobsCount} />}>
      {children}
    </Tooltip>
  ) : null;
};

ScheduleTooltip.propTypes = {
  job: Job,
  jobs: PropTypes.arrayOf(Job),
  filter: PropTypes.func,
  jobsCount: PropTypes.number,
  children: PropTypes.node.isRequired
};

ScheduleTooltip.defaultProps = {
  jobsCount: 0
};

export { ScheduleTooltipContent };

export default ScheduleTooltip;
