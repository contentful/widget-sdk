import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import moment from 'moment';
import { SectionHeading, Tag } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { Icon } from '@contentful/forma-36-react-components';

import ScheduledActionsEmptyStateMessage from './ScheduledActionsEmptyStateMessage';
import WrappedEntityList from 'app/common/WrappedEntityList';
import ScheduledActionAction from '../ScheduledActionAction';
import { formatDate } from 'app/ScheduledActions/FormattedDateAndTime';

const styles = {
  jobsSchedule: css({}),
  dateGroup: css({
    paddingTop: tokens.spacingL,
  }),
  dateGroupHeader: css({
    borderBottom: `1px solid ${tokens.colorElementLight}`,
    paddingBottom: tokens.spacingXs,
    marginBottom: tokens.spacingL,
  }),
  timeGroup: css({ display: 'flex', marginBottom: tokens.spacingL }),
  timeGroupHeader: css({
    marginRight: tokens.spacingM,
    marginTop: tokens.spacingS,
    textAlign: 'right',
    minWidth: '130px',
  }),
  timeGroupListWrapper: css({
    maxWidth: 'calc(100% - 146px)',
    flexGrow: 1,
    paddingLeft: tokens.spacingM,
    borderLeft: `1px solid ${tokens.colorElementLight}`,
  }),
  timeGroupListItem: css({
    marginBottom: 0,
  }),
  jobsStatusLabel: css({
    display: 'flex',
  }),
  statusTagIcon: css({
    marginRight: tokens.spacing2Xs,
  }),
};

const jobPropType = PropTypes.shape({
  sys: PropTypes.shape({
    id: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
  }).isRequired,
  scheduledAt: PropTypes.string,
  scheduledFor: PropTypes.shape({
    datetime: PropTypes.string,
  }),
  action: PropTypes.string,
});

const TimeGroup = ({ jobs, entitiesById, contentTypesData }) => {
  const tagType = jobs[0].action === ScheduledActionAction.Publish ? 'positive' : 'secondary';
  const isScheduleCompleted = jobs[0].sys.status === 'succeeded';

  return (
    <div className={styles.timeGroup}>
      <div className={styles.timeGroupHeader}>
        <SectionHeading>{moment(jobs[0].scheduledFor.datetime).format('hh:mm A')}</SectionHeading>
        <Tag tagType={tagType}>
          {isScheduleCompleted ? (
            <div className={styles.jobsStatusLabel}>
              <Icon className={styles.statusTagIcon} icon="CheckCircle" color={tagType} />
              <span>{`${jobs[0].action}ed`}</span>
            </div>
          ) : (
            jobs[0].action
          )}
        </Tag>
      </div>
      <div className={styles.timeGroupListWrapper}>
        <WrappedEntityList
          entities={jobs.map((job) => entitiesById[job.entity.sys.id])}
          contentTypes={contentTypesData}
        />
      </div>
    </div>
  );
};

TimeGroup.propTypes = {
  jobs: PropTypes.arrayOf(jobPropType),
  entitiesById: PropTypes.object,
  contentTypesData: PropTypes.object,
};

const DateGroup = ({ jobs, entitiesById, contentTypesData }) => {
  const timeGroups = _.chain(jobs)
    .groupBy((job) => `${moment(job.scheduledFor.datetime).format('HH:mm')}-${job.action}`)
    .map((job) => job)
    .value();

  return (
    <div className={styles.dateGroup} data-test-id="scheduled-jobs-date-group">
      <SectionHeading className={styles.dateGroupHeader}>
        {formatDate(jobs[0].scheduledFor.datetime)}
      </SectionHeading>
      {timeGroups.map((jobs) => (
        <TimeGroup
          jobs={jobs}
          key={`${jobs[0].sys.id}-timeGroup`}
          entitiesById={entitiesById}
          contentTypesData={contentTypesData}
        />
      ))}
    </div>
  );
};

DateGroup.propTypes = {
  jobs: PropTypes.arrayOf(jobPropType),
  entitiesById: PropTypes.object,
  contentTypesData: PropTypes.object,
};

export default class JobsSchedule extends React.Component {
  static propTypes = {
    jobs: PropTypes.arrayOf(jobPropType),
    entitiesById: PropTypes.object,
    contentTypesData: PropTypes.object,
    emptyStateMessage: PropTypes.object,
  };

  render() {
    const { jobs, entitiesById, contentTypesData, emptyStateMessage } = this.props;
    if (!this.props.jobs.length) {
      return null;
    }

    const jobsWithExisitingEntity = jobs.filter((job) => entitiesById[job.entity.sys.id]);
    const groupedJobs = _.chain(jobsWithExisitingEntity)
      .groupBy((item) => moment(item.scheduledFor.datetime).format('YYYY.MM.DD'))
      .map((item) => item)
      .value();
    return (
      <div>
        {groupedJobs && groupedJobs.length > 0 ? (
          groupedJobs.map((jobsGroup) => (
            <DateGroup
              jobs={jobsGroup}
              key={`${jobsGroup[0].sys.id}-dateGroup`}
              entitiesById={entitiesById}
              contentTypesData={contentTypesData}
            />
          ))
        ) : (
          <ScheduledActionsEmptyStateMessage
            title={emptyStateMessage.title}
            text={emptyStateMessage.text}
          />
        )}
      </div>
    );
  }
}
