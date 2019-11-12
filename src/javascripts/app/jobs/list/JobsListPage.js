import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { css } from 'emotion';
import {
  SkeletonContainer,
  SkeletonText,
  Tabs,
  Tab,
  TabPanel
} from '@contentful/forma-36-react-components';
import Icon from 'ui/Components/Icon';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';
import JobsTable from './JobsTable';

import DocumentTitle from 'components/shared/DocumentTitle';

import createFetcherComponent from 'app/common/createFetcherComponent';

import * as EndpointFactory from 'data/EndpointFactory';

import { getJobsData } from './JobsListService';
import JobsEmptyStateMessage from './JobsEmptyStateMessage';
import UnknownErrorMessage from 'components/shared/UnknownErrorMessage';
import JobsSchedule from './JobsSchedule';

function normalizeCollection(items) {
  return _.fromPairs(items.map(i => [i.sys.id, i]));
}

const styles = {
  alphaTag: css({
    lineHeight: '30px',
    marginTop: '2px',
    fontSize: '1rem'
  }),
  workbenchTitle: css({
    marginRight: '0.5rem'
  }),
  workbenchContent: css({
    padding: tokens.spacingXl
  }),
  tabPanel: css({
    paddingTop: tokens.spacingL
  })
};

const JobsFetcher = createFetcherComponent(
  async ({ spaceId, environmentId, contentTypes, query }) => {
    const spaceEndpoint = EndpointFactory.createSpaceEndpoint(spaceId, environmentId);

    const { jobs, entries, users } = await getJobsData(spaceEndpoint, query);

    return Promise.resolve([
      jobs,
      normalizeCollection(entries),
      normalizeCollection(users),
      normalizeCollection(contentTypes)
    ]);
  }
);

const JobsListShell = props => (
  <Workbench>
    <Workbench.Header
      icon={<Icon name="schedule-calendar" scale={0.75} />}
      title="Scheduled Content"
      onBack={() => {
        window.history.back();
      }}
    />
    <Workbench.Content type="text" className={styles.workbenchContent}>
      <div>{props.children}</div>
    </Workbench.Content>
  </Workbench>
);

const ItemSkeleton = props => (
  <React.Fragment>
    <SkeletonText offsetTop={props.baseTop + 32.5} offsetLeft={0} lineHeight={20} width="15%" />
    <SkeletonText offsetTop={props.baseTop} offsetLeft="20%" lineHeight={40} width="80%" />
    <SkeletonText offsetTop={props.baseTop + 50} offsetLeft="20%" lineHeight={40} width="80%" />
  </React.Fragment>
);
ItemSkeleton.propTypes = {
  baseTop: PropTypes.number
};

export const JobsListPageLoading = () => {
  return (
    <SkeletonContainer svgWidth="100%" svgHeight={300} ariaLabel="Loading jobs list...">
      <SkeletonText offsetTop={20} offsetLeft={0} lineHeight={20} width="100%" />
      <ItemSkeleton baseTop={50} />
      <SkeletonText offsetTop={170} offsetLeft={0} lineHeight={20} width="100%" />
      <ItemSkeleton baseTop={200} />
    </SkeletonContainer>
  );
};

export default class JobsListPage extends Component {
  static propTypes = {
    spaceId: PropTypes.string.isRequired,
    environmentId: PropTypes.string.isRequired,
    contentTypes: PropTypes.array.isRequired,
    defaultLocale: PropTypes.object.isRequired
  };

  tabs = {
    scheduledJobs: {
      title: 'Scheduled',
      description: 'Entries that are currently scheduled to publish.',
      emptyStateMessage: {
        title: 'Nothing is scheduled at the moment',
        text: 'Entries that are scheduled to publish will show up here'
      },
      query: {
        'sys.status': 'pending',
        order: 'sys.scheduledAt'
      }
    },
    completedJobs: {
      title: 'Completed',
      description: 'Entries that were successfully published',
      emptyStateMessage: {
        title: 'No entries have been successfully published yet',
        text: 'Successfully published entries will show up here'
      },
      query: {
        'sys.status': 'done',
        order: '-sys.scheduledAt'
      }
    },
    erroredJobs: {
      title: 'Failed',
      description: 'Entries that failed to publish',
      emptyStateMessage: {
        title: 'Nothing here',
        text: 'Scheduled entries that have failed to publish will show up here.'
      },
      query: {
        'sys.status': 'failed',
        order: '-sys.scheduledAt'
      }
    }
  };

  state = {
    activeTab: 'scheduledJobs'
  };

  render() {
    return (
      <JobsListShell>
        <DocumentTitle title="Scheduled Content" />
        {this.renderJobs()}
      </JobsListShell>
    );
  }

  renderTabNavigation = () => (
    <Tabs withDivider>
      {Object.keys(this.tabs).map(key => (
        <Tab
          key={key}
          selected={this.state.activeTab === key}
          id={key}
          onSelect={id => this.setState({ activeTab: id })}>
          {this.tabs[key].title}
        </Tab>
      ))}
    </Tabs>
  );

  renderJobs() {
    const { activeTab } = this.state;

    return (
      <div>
        {this.renderTabNavigation()}
        <TabPanel className={styles.tabPanel} id={activeTab}>
          <JobsFetcher
            key={activeTab}
            spaceId={this.props.spaceId}
            environmentId={this.props.environmentId}
            contentTypes={this.props.contentTypes}
            query={this.tabs[activeTab].query}>
            {({ isLoading, isError, data }) => {
              if (isLoading) {
                return <JobsListPageLoading />;
              }
              if (isError) {
                return <UnknownErrorMessage data-test-id="cf-ui-jobs-state-error" />;
              }

              const [jobs, entries, users, contentTypes] = data;

              if (jobs.length === 0) {
                return (
                  <JobsEmptyStateMessage
                    title={this.tabs[activeTab].emptyStateMessage.title}
                    text={this.tabs[activeTab].emptyStateMessage.text}
                  />
                );
              }

              return activeTab !== 'erroredJobs' ? (
                <JobsSchedule
                  jobs={jobs}
                  entriesData={entries}
                  usersData={users}
                  emptyStateMessage={this.tabs[activeTab].emptyStateMessage}
                  contentTypesData={contentTypes}
                />
              ) : (
                <JobsTable
                  description={this.tabs[activeTab].description}
                  jobs={jobs}
                  entriesData={entries}
                  usersData={users}
                  contentTypesData={contentTypes}
                  defaultLocale={this.props.defaultLocale}
                />
              );
            }}
          </JobsFetcher>
        </TabPanel>
      </div>
    );
  }
}
