import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import moment from 'moment';
import { SectionHeading, Tag } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

import JobsEmptyStateMessage from './JobsEmptyStateMessage';
import WrappedEntityList from 'app/common/WrappedEntityList/index';
import JobAction from '../JobAction';

const styles = {
  jobsSchedule: css({}),
  dateGroup: css({
    paddingTop: tokens.spacingL
  }),
  dateGroupHeader: css({
    borderBottom: `1px solid ${tokens.colorElementLight}`,
    paddingBottom: tokens.spacingXs,
    marginBottom: tokens.spacingL
  }),
  timeGroup: css({ display: 'flex', marginBottom: tokens.spacingL }),
  timeGroupHeader: css({
    marginRight: tokens.spacingM,
    marginTop: tokens.spacingS,
    textAlign: 'right',
    minWidth: '90px'
  }),
  timeGroupListWrapper: css({
    maxWidth: 'calc(100% - 95px)',
    flexGrow: 1,
    paddingLeft: tokens.spacingM,
    borderLeft: `1px solid ${tokens.colorElementLight}`
  }),
  timeGroupListItem: css({
    marginBottom: 0
  })
};

const jobPropType = PropTypes.shape({
  scheduledAt: PropTypes.string,
  action: PropTypes.string
});

const TimeGroup = ({ jobs, entriesData, contentTypesData }) => {
  return (
    <div className={styles.timeGroup}>
      <div className={styles.timeGroupHeader}>
        <SectionHeading>{moment(jobs[0].scheduledAt).format('hh:mm A')}</SectionHeading>
        <Tag tagType={jobs[0].action === JobAction.Publish ? 'positive' : 'secondary'}>
          {jobs[0].action}
        </Tag>
      </div>
      <div className={styles.timeGroupListWrapper}>
        <WrappedEntityList
          entities={jobs.map(job => entriesData[job.sys.entity.sys.id])}
          contentTypes={contentTypesData}
        />
      </div>
    </div>
  );
};

TimeGroup.propTypes = {
  jobs: PropTypes.arrayOf(jobPropType),
  entriesData: PropTypes.object,
  contentTypesData: PropTypes.object
};

function formatDate(date) {
  switch (
    moment()
      .startOf('day')
      .diff(moment(date).startOf('day'), 'days')
  ) {
    case 0:
      return `Today, ${moment(date).format('MMM Do, YYYY')}`;
    case -1:
      return `Tomorrow, ${moment(date).format('MMM Do, YYYY')}`;
    case 1:
      return `Yesterday, ${moment(date).format('MMM Do, YYYY')}`;
    default:
      return moment(date).format('ddd, MMM Do, YYYY');
  }
}

const DateGroup = ({ jobs, entriesData, contentTypesData }) => {
  const timeGroups = _.chain(jobs)
    .groupBy(job => `${moment(job.scheduledAt).format('HH:mm')}-${job.action}`)
    .map(job => job)
    .value();
  return (
    <div className={styles.dateGroup} data-test-id="scheduled-jobs-date-group">
      <SectionHeading className={styles.dateGroupHeader}>
        {formatDate(jobs[0].scheduledAt)}
      </SectionHeading>
      {timeGroups.map((jobs, index) => (
        <TimeGroup
          jobs={jobs}
          key={`${jobs[0].scheduledAt}-${index}`}
          entriesData={entriesData}
          contentTypesData={contentTypesData}
        />
      ))}
    </div>
  );
};

DateGroup.propTypes = {
  jobs: PropTypes.arrayOf(jobPropType),
  entriesData: PropTypes.object,
  contentTypesData: PropTypes.object
};

export default class JobsSchedule extends React.Component {
  static propTypes = {
    jobs: PropTypes.arrayOf(jobPropType),
    entriesData: PropTypes.object,
    contentTypesData: PropTypes.object,
    emptyStateMessage: PropTypes.object
  };

  render() {
    const { jobs, entriesData, contentTypesData, emptyStateMessage } = this.props;
    if (!this.props.jobs.length) {
      return null;
    }

    const jobsWithExisitingEntry = jobs.filter(job => entriesData[job.sys.entity.sys.id]);
    const groupedJobs = _.chain(jobsWithExisitingEntry)
      .groupBy(item => moment(item.scheduledAt).format('YYYY.MM.DD'))
      .map(item => item)
      .value();
    return (
      <div>
        {groupedJobs && groupedJobs.length > 0 ? (
          groupedJobs.map((jobsGroup, index) => (
            <DateGroup
              jobs={jobsGroup}
              key={`${jobsGroup[0].scheduledAt}-${index}`}
              entriesData={entriesData}
              contentTypesData={contentTypesData}
            />
          ))
        ) : (
          <JobsEmptyStateMessage title={emptyStateMessage.title} text={emptyStateMessage.text} />
        )}
      </div>
    );
  }
}
