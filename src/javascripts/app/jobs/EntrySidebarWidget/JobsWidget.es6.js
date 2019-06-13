import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import moment from 'moment';

import tokens from '@contentful/forma-36-tokens';

import {
  SkeletonContainer,
  SkeletonBodyText,
  Note,
  TextLink
} from '@contentful/forma-36-react-components';
import JobsTimeline from './JobsTimeline/index.es6';
import JobsFetcher from './JobsFetcher.es6';
import { createJob } from '../DataManagement/JobsService.es6';
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
    // used to re-fetch Jobs after creation
    fetcherKey: 0
  };
  endpoint = createSpaceEndpoint(this.props.spaceId, this.props.environmentId);
  handleJobCreate = ({ scheduledAt }) => {
    const { spaceId, environmentId, userId, entityInfo } = this.props;

    const jobDto = create({
      spaceId,
      environmentId,
      userId,
      entityId: entityInfo.id,
      action: 'publish',
      scheduledAt
    });

    createJob(this.endpoint, jobDto).then(() => {
      this.setState({
        fetcherKey: this.state.fetcherKey + 1
      });
    });
  };

  isPublishedAfterLastFailedJob = job =>
    moment(this.props.entity.publishedAt).isBefore(job.scheduledAt);

  renderFailedScheduleNote = data => {
    const recentJob = data.jobCollection.items[0];
    const prevJob = data.jobCollection.items[1];

    if (!recentJob) {
      return null;
    }

    const entryHasBeenPublishedAfterLastFailedJob = this.isPublishedAfterLastFailedJob(recentJob);

    return (
      !entryHasBeenPublishedAfterLastFailedJob && (
        <FailedScheduleNote recentJob={recentJob} prevJob={prevJob} />
      )
    );
  };

  render() {
    return (
      <div className={styles.root}>
        <JobsFetcher
          key={this.state.fetcherKey}
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
                  <JobsTimeline jobs={pendingJobs} entity={this.props.entity} />
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
