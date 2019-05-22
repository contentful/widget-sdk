import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import Workbench from 'app/common/Workbench.es6';
import {
  SkeletonContainer,
  SkeletonText,
  Tabs,
  Tab,
  TabPanel
} from '@contentful/forma-36-react-components';
import JobsTable from './JobsTable.es6';

import DocumentTitle from 'components/shared/DocumentTitle.es6';

import createFetcherComponent from 'app/common/createFetcherComponent.es6';

import { createSpaceEndpoint } from '../DataManagement/JobsEndpointFactory.es6';

import { getJobsData } from './JobsListService.es6';
import JobsEmptyStateMessage from './JobsEmptyStateMessage.es6';

function normalizeCollection(items) {
  return _.fromPairs(items.map(i => [i.sys.id, i]));
}

const JobsFetcher = createFetcherComponent(
  async ({ spaceId, environmentId, contentTypes, query }) => {
    const spaceEndpoint = createSpaceEndpoint(spaceId, environmentId);

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
    <Workbench.Header>
      <Workbench.Icon icon="schedule-calendar" scale="1" />
      <Workbench.Title>Jobs Schedule</Workbench.Title>
    </Workbench.Header>
    <Workbench.Content className="f36-padding--xl">
      <div>{props.children}</div>
    </Workbench.Content>
  </Workbench>
);

const ItemSkeleton = props => (
  <React.Fragment>
    <SkeletonText offsetTop={props.baseTop} offsetLeft="1%" lineHeight={8} width="18%" />
    <SkeletonText offsetTop={props.baseTop} offsetLeft="21%" lineHeight={8} width="18%" />
    <SkeletonText offsetTop={props.baseTop} offsetLeft="41%" lineHeight={8} width="18%" />
    <SkeletonText offsetTop={props.baseTop} offsetLeft="61%" lineHeight={8} width="18%" />
    <SkeletonText offsetTop={props.baseTop} offsetLeft="81%" lineHeight={8} width="18%" />
  </React.Fragment>
);
ItemSkeleton.propTypes = {
  baseTop: PropTypes.number
};

export const JobsListPageLoading = () => {
  return (
    <SkeletonContainer svgWidth="100%" svgHeight={200} ariaLabel="Loading jobs list...">
      <SkeletonText offsetTop={0} offsetLeft={0} lineHeight={40} width="100%" />
      <ItemSkeleton baseTop={60} />
      <ItemSkeleton baseTop={90} />
      <ItemSkeleton baseTop={120} />
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
      title: 'Scheduled Jobs',
      description: 'A list of entries scheduled to change status.',
      emptyStateMessage: {
        title: 'There are no Jobs scheduled',
        text: 'Entries that are scheduled for publishing will show up here'
      },
      query: {
        'sys.status': 'pending',
        order: '-sys.scheduledAt'
      }
    },
    completedJobs: {
      title: 'Completed Jobs',
      description: 'A list of completed jobs',
      emptyStateMessage: {
        title: 'No Jobs completed yet',
        text: 'As soon as Jobs are complete they will show up here'
      },
      query: {
        'sys.status': 'done'
      }
    },
    erroredJobs: {
      title: 'Errored Jobs',
      description: 'A list of errored jobs.',
      emptyStateMessage: {
        title: 'All Jobs executed successfully',
        text: 'If Jobs fail to excecute they will show up here'
      },
      query: {
        'sys.status': 'error'
      }
    }
  };

  state = {
    activeTab: 'scheduledJobs'
  };

  render() {
    return (
      <JobsListShell>
        <DocumentTitle title="Jobs Schedule" />
        {this.renderJobs()}
      </JobsListShell>
    );
  }

  renderTabNavigation = () => (
    <Tabs>
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
        <TabPanel className="f36-padding-top--l" id={activeTab}>
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
                return (
                  <JobsEmptyStateMessage
                    title="Something went wrong"
                    text="We are sorry but something went wrong"
                    data-test-id="cf-ui-jobs-state-error"
                  />
                );
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

              return (
                <JobsTable
                  showStatusTransition={activeTab === 'scheduledJobs'}
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
