import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import { css } from 'emotion';
import _ from 'lodash';
import moment from 'moment';

import Job from './ScheduledAction';
import { TextLink, Subheading, List } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { ScheduledActionsStateLink } from 'app/ScheduledActions/ScheduledActionsPageLink';

const styles = {
  wrapper: css({
    margin: `-${tokens.spacingXl} -${tokens.spacingXl} ${tokens.spacingS} -${tokens.spacingXl}`,
    padding: `${tokens.spacingXl} ${tokens.spacingXl} ${tokens.spacingM}`,
    background: tokens.colorElementLightest,
  }),
  alphaSideBarHeading: css({
    display: 'flex',
  }),
  headingSmall: css({
    marginTop: 0,
  }),
  alphaTag: css({
    marginLeft: 'auto',
  }),
  jobList: css({
    marginBottom: tokens.spacingM,
    maxHeight: '300px',
    overflowY: 'auto',
  }),
  divider: css({
    height: 20,
    marginBottom: tokens.spacingXs,
    position: 'relative',
    background: '#f7f9fa',
    textAlign: 'center',
    ':before': {
      top: 9,
      content: '""',
      left: 0,
      position: 'absolute',
      width: '100%',
      height: '1px',
      background: tokens.colorTextLightest,
    },
  }),
  dividerDate: css({
    left: 0,
    padding: '0px 5px',
    color: tokens.colorTextLight,
    background: '#f7f9fa',
    position: 'absolute',
    marginLeft: '50%',
    transform: 'translateX(-50%)',
  }),
  jobListSmall: css({
    maxHeight: '160px',
    overflowY: 'auto',
    position: 'relative',
    marginBottom: '0px',
  }),
  jobListWrapper: css({
    position: 'relative',
    ':before': {
      zIndex: 1,
      content: '""',
      pointerEvents: 'none',
      position: 'absolute',
      height: '30px',
      width: '100%',
      left: 0,
      bottom: 0,
      background: `linear-gradient(0deg, rgba(247, 249, 250, 1) 0%, rgba(247, 249, 250, 0) 50%, rgba(247, 249, 250, 0) 100%)`,
    },
  }),
  jobListWrapperSmall: css({
    ':before': {
      zIndex: 1,
      content: '""',
      pointerEvents: 'none',
      position: 'absolute',
      height: '40px',
      width: '100%',
      left: 0,
      bottom: 0,
      background: `linear-gradient(0deg, rgba(247, 249, 250, 1) 0%, rgba(247, 249, 250, 0) 50%, rgba(247, 249, 250, 0) 100%)`,
    },
  }),
};

const Divider = ({ currentJob, nextJob }) => {
  if (!nextJob) {
    return null;
  }

  const formatDate = (curDate, nextDate) => {
    const dayDifference = moment(curDate)
      .startOf('day')
      .diff(moment(nextDate).startOf('day'), 'days');

    if (dayDifference === 0) {
      return null;
    } else if (dayDifference === -1) {
      return `1 Day`;
    } else {
      return `${-dayDifference} Days`;
    }
  };

  const formattedDate = formatDate(currentJob.scheduledFor.datetime, nextJob.scheduledFor.datetime);

  if (!formattedDate) {
    return null;
  }

  return (
    <div className={styles.divider}>
      <span className={styles.dividerDate}>
        {formatDate(currentJob.scheduledFor.datetime, nextJob.scheduledFor.datetime)}
      </span>
    </div>
  );
};

Divider.propTypes = {
  currentJob: PropTypes.shape({
    scheduledFor: PropTypes.shape({
      datetime: PropTypes.string,
    }),
  }),
  nextJob: PropTypes.shape({
    scheduledFor: PropTypes.shape({
      datetime: PropTypes.string,
    }),
  }),
};

const JobsTimeline = ({
  isMasterEnvironment,
  jobs,
  onCancel,
  isReadOnly,
  showAllScheduleLink,
  size,
}) => {
  const jobsSortedByScheduledFor = _.sortBy(jobs, 'scheduledFor.datetime');
  return (
    <div className={styles.wrapper}>
      <header className="entity-sidebar__header">
        <Subheading
          className={cn(
            styles.alphaSideBarHeading,
            size === 'small' ? styles.headingSmall : '',
            'entity-sidebar__heading'
          )}>
          Current Schedule
        </Subheading>
      </header>
      <div
        className={cn(styles.jobListWrapper, size === 'small' ? styles.jobListWrapperSmall : '')}>
        <List className={cn(styles.jobList, size === 'small' ? styles.jobListSmall : '')}>
          {jobsSortedByScheduledFor.map((job, index) => (
            <li key={`${job.action}-${job.scheduledFor.datetime}-${index}`}>
              <Job job={job} onCancel={onCancel} isReadOnly={isReadOnly} size={size} />
              {size === 'default' && (
                <Divider currentJob={job} nextJob={jobsSortedByScheduledFor[index + 1]} />
              )}
            </li>
          ))}
        </List>
      </div>
      {showAllScheduleLink && (
        <ScheduledActionsStateLink isMasterEnvironment={isMasterEnvironment}>
          {({ getHref, onClick }) => (
            <TextLink linkType="muted" href={getHref()} onClick={onClick}>
              View all scheduled entries
            </TextLink>
          )}
        </ScheduledActionsStateLink>
      )}
    </div>
  );
};

JobsTimeline.propTypes = {
  jobs: PropTypes.array.isRequired,
  onCancel: PropTypes.func,
  isMasterEnvironment: PropTypes.bool.isRequired,
  isReadOnly: PropTypes.bool.isRequired,
  showAllScheduleLink: PropTypes.bool,
  size: PropTypes.oneOf(['default', 'small']),
  hasAlphaTag: PropTypes.bool,
};

JobsTimeline.defaultProps = {
  onCancel: () => {},
  showAllScheduleLink: true,
  size: 'default',
  hasAlphaTag: false,
};

export default JobsTimeline;
