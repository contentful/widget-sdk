import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import tokens from '@contentful/forma-36-tokens';

import { SkeletonContainer, SkeletonBodyText } from '@contentful/forma-36-react-components';

import ScheduleTimeline from './ScheduleTimeline/index.es6';
import ScheduleFetcher from './ScheduleFetcher.es6';
import { createSchedule } from './ScheduleService.es6';
import NewSchedule from './NewSchedule.es6';

import { createSpaceEndpoint } from './ScheduleEndpointFactory.es6';

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

export default class ScheduleWidget extends React.Component {
  static propTypes = {
    spaceId: PropTypes.string.isRequired,
    envId: PropTypes.string.isRequired,
    entityInfo: PropTypes.object.isRequired
  };
  state = {
    // used to re-fetch schedules after creation
    fetcherKey: 0
  };
  endpoint = createSpaceEndpoint(this.props.spaceId, this.props.envId);
  handleScheduleCreate = scheduleDto => {
    createSchedule(this.endpoint, this.props.entityInfo.id, scheduleDto).then(() => {
      this.setState({
        fetcherKey: this.state.fetcherKey + 1
      });
    });
  };
  render() {
    return (
      <div className={styles.root}>
        <ScheduleFetcher
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
              return 'Error';
            }
            const hasScheduledActions = data.scheduleCollection.items.length > 0;

            return (
              <React.Fragment>
                <div className={styles.heading}>Scheduled Publication</div>
                {hasScheduledActions ? (
                  <ScheduleTimeline schedules={data.scheduleCollection.items} />
                ) : (
                  <NewSchedule onCreate={this.handleScheduleCreate} />
                )}
              </React.Fragment>
            );
          }}
        </ScheduleFetcher>
      </div>
    );
  }
}
