import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import tokens from '@contentful/forma-36-tokens';

import { SkeletonContainer, SkeletonBodyText } from '@contentful/forma-36-react-components';

import JobsTimeline from './JobsTimeline/index.es6';
import JobsFetcher from './JobsFetcher.es6';
import { createJob } from './JobsService.es6';
import NewJob from './NewJob.es6';

import { createSpaceEndpoint } from './JobsEndpointFactory.es6';

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
    envId: PropTypes.string.isRequired,
    entityInfo: PropTypes.object.isRequired
  };
  state = {
    // used to re-fetch Jobs after creation
    fetcherKey: 0
  };
  endpoint = createSpaceEndpoint(this.props.spaceId, this.props.envId);
  handleJobCreate = jobDto => {
    createJob(this.endpoint, this.props.entityInfo.id, jobDto).then(() => {
      this.setState({
        fetcherKey: this.state.fetcherKey + 1
      });
    });
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
              return 'Error';
            }
            const hasScheduledActions = data.jobCollection.items.length > 0;

            return (
              <React.Fragment>
                <div className={styles.heading}>Scheduled Publication</div>
                {hasScheduledActions ? (
                  <JobsTimeline jobs={data.jobCollection.items} />
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
