import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import moment from 'moment';

import tokens from '@contentful/forma-36-tokens';

import {
  SkeletonContainer,
  SkeletonBodyText,
  Note,
  TextLink,
  Notification
} from '@contentful/forma-36-react-components';
import JobsTimeline from './JobsTimeline/index.es6';
import JobsFetcher from './JobsFetcher.es6';
import { createJob, cancelJob } from '../DataManagement/JobsService.es6';
import NewJob from './NewJob.es6';
import { create } from './JobsFactory.es6';
import FailedScheduleNote from './FailedScheduleNote/index.es6';

import { createSpaceEndpoint } from '../DataManagement/JobsEndpointFactory.es6';

const styles = {
  root: css({
    paddingTop: tokens.spacingM
  }),
  skeleton: css({}),
  heading: css({
    fontSize: tokens.fontSizeS,
    fontWeight: tokens.fontWeightNormal,
    textTransform: 'uppercase',
    color: tokens.colorTextLight,
    borderBottom: `1px solid ${tokens.colorElementDark}`,
    marginBottom: tokens.spacingM,
    marginTop: tokens.spacingM,
    lineHeight: tokens.lineHeightDefault,
    letterSpacing: tokens.letterSpacingWide
  })
};

export default class JobWidget extends React.Component {
  static propTypes = {
    spaceId: PropTypes.string.isRequired,
    environmentId: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
    entityInfo: PropTypes.object.isRequired,
    entity: PropTypes.object.isRequired
  };

  state = {
    fetcherKey: '1'
  };

  endpoint = createSpaceEndpoint(this.props.spaceId, this.props.environmentId);
  handleJobCreate = ({ scheduledAt }) => {
    const { spaceId, environmentId, userId, entityInfo } = this.props;

    const createJobDto = create({
      spaceId,
      environmentId,
      userId,
      entityId: entityInfo.id,
      action: 'publish',
      scheduledAt
    });

    createJob(this.endpoint, createJobDto).then(() => {
      this.setState({
        fetcherKey: this.state.fetcherKey + '1'
      });
    });
  };

  handleCancellation = jobId => {
    cancelJob(this.endpoint, jobId).then(() => {
      this.setState({
        fetcherKey: this.state.fetcherKey + '1'
      });
      Notification.success('Schedule cancelled');
    });
  };

  renderFailedScheduleNote = data => {
    const recentJob = data.jobCollection.items[0];

    if (!recentJob) {
      return null;
    }

    const entryPublishedAfterLastFailedJob = moment(this.props.entity.sys.publishedAt).isAfter(
      recentJob.scheduledAt
    );

    return (
      !entryPublishedAfterLastFailedJob &&
      recentJob.sys.status === 'failed' && <FailedScheduleNote recentJob={recentJob} />
    );
  };

  componentDidUpdate(prevProps) {
    // Typical usage (don't forget to compare props):
    if (this.props.entity.sys.publishedAt !== prevProps.entity.sys.publishedAt) {
      this.setState({
        fetcherKey: this.state.fetcherKey + '1'
      });
    }
  }

  render() {
    return (
      <div className={styles.root}>
        <JobsFetcher
          key={this.state.fetcherKey}
          publishedAt={this.props.entity.sys.publishedAt}
          endpoint={this.endpoint}
          entryId={this.props.entityInfo.id}>
          {({ isLoading, isError, data }) => {
            if (isLoading) {
              return (
                <SkeletonContainer>
                  <SkeletonBodyText numberOfLines={2} />
                </SkeletonContainer>
              );
            }
            if (isError) {
              // Implement proper error handling
              return (
                <Note noteType="warning">
                  {`We were unable to load the schedule for this entry. `}
                  <TextLink onClick={() => window.location.reload()}>Please refresh.</TextLink>
                </Note>
              );
            }

            const pendingJobs = data.jobCollection.items.filter(
              schedule => schedule.sys.status === 'pending'
            );
            const hasScheduledActions = pendingJobs.length > 0;

            return (
              <React.Fragment>
                <div className={styles.heading}>Schedule</div>
                {this.renderFailedScheduleNote(data)}
                {hasScheduledActions ? (
                  <JobsTimeline
                    environmentId={this.props.environmentId}
                    jobs={pendingJobs}
                    onCancel={this.handleCancellation}
                  />
                ) : (
                  <NewJob onCreate={this.handleJobCreate} />
                )}
              </React.Fragment>
            );
          }}
        </JobsFetcher>
      </div>
    );
  }
}
