import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { css } from 'emotion';
import {
  Button,
  SkeletonContainer,
  SkeletonText,
  Tabs,
  Tab,
  TabPanel,
  Workbench,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import Icon from 'ui/Components/Icon';
import UnknownErrorMessage from 'components/shared/UnknownErrorMessage';
import DocumentTitle from 'components/shared/DocumentTitle';
import getQueryStringParams from 'utils/getQueryStringParams';
import * as EndpointFactory from 'data/EndpointFactory';
import * as logger from 'services/logger';

import ScheduledActionsTable from './ScheduledActionsTable';
import { getJobsData } from './ScheduledActionsListService';
import ScheduledActionsEmptyStateMessage from './ScheduledActionsEmptyStateMessage';
import ScheduledActionsSchedule from './ScheduledActionsSchedule';

function normalizeCollection(items) {
  return _.fromPairs(items.map((i) => [i.sys.id, i]));
}

const styles = {
  alphaTag: css({
    lineHeight: '30px',
    marginTop: '2px',
    fontSize: '1rem',
  }),
  workbenchTitle: css({
    marginRight: '0.5rem',
  }),
  workbenchContent: css({
    padding: tokens.spacingXl,
  }),
  tabPanel: css({
    paddingTop: tokens.spacingL,
  }),
  loadMoreButtonWrapper: css({
    display: 'flex',
    justifyContent: 'center',
  }),
};

const ItemSkeleton = ({ baseTop }) => (
  <>
    <SkeletonText offsetTop={baseTop + 32.5} offsetLeft={0} lineHeight={20} width="15%" />
    <SkeletonText offsetTop={baseTop} offsetLeft="20%" lineHeight={40} width="80%" />
    <SkeletonText offsetTop={baseTop + 50} offsetLeft="20%" lineHeight={40} width="80%" />
  </>
);

ItemSkeleton.propTypes = {
  baseTop: PropTypes.number,
};

export const JobsListPageLoading = () => (
  <SkeletonContainer svgWidth="100%" svgHeight={300} ariaLabel="Loading jobs list...">
    <SkeletonText offsetTop={20} offsetLeft={0} lineHeight={20} width="100%" />
    <ItemSkeleton baseTop={50} />
    <SkeletonText offsetTop={170} offsetLeft={0} lineHeight={20} width="100%" />
    <ItemSkeleton baseTop={200} />
  </SkeletonContainer>
);

export const TabTypes = {
  ScheduledJobs: 'ScheduledJobs',
  CompletedJobs: 'CompletedJobs',
  ErroredJobs: 'ErroredJobs',
};

const TabsData = {
  [TabTypes.ScheduledJobs]: {
    title: 'Scheduled',
    description: 'Entries that are currently scheduled to publish.',
    emptyStateMessage: {
      title: 'Nothing is scheduled at the moment',
      text: 'Entries that are scheduled to publish will show up here',
    },
    query: {
      'sys.status': 'scheduled',
      order: 'scheduledFor.datetime',
      limit: 40,
    },
  },
  [TabTypes.CompletedJobs]: {
    title: 'Completed',
    description: 'Entries that were successfully published',
    emptyStateMessage: {
      title: 'No entries have been successfully published yet',
      text: 'Successfully published entries will show up here',
    },
    query: {
      'sys.status': 'succeeded',
      order: '-scheduledFor.datetime',
      limit: 40,
    },
  },
  [TabTypes.ErroredJobs]: {
    title: 'Failed',
    description: 'Entries that failed to publish',
    emptyStateMessage: {
      title: 'Nothing here',
      text: 'Scheduled entries that have failed to publish will show up here.',
    },
    query: {
      'sys.status': 'failed',
      order: '-scheduledFor.datetime',
      limit: 40,
    },
  },
};

const JobsListShell = ({ children }) => (
  <Workbench>
    <Workbench.Header
      icon={<Icon name="schedule-calendar" scale={0.75} />}
      title="Scheduled Content"
      onBack={() => {
        window.history.back();
      }}
    />
    <Workbench.Content type="text" className={styles.workbenchContent}>
      <div>{children}</div>
    </Workbench.Content>
  </Workbench>
);

class JobsListPage extends Component {
  constructor(props) {
    super(props);

    this.initialState = {
      isError: false,
      isInitialLoad: true,
      isLoading: false,
      activeTab: props.activeTab,
      nextQuery: TabsData[props.activeTab].query,
      jobCount: 0,
      scheduleData: {
        jobs: [],
        entries: {},
        users: {},
        contentTypes: {},
      },
    };
    this.state = {
      ...this.initialState,
    };
  }

  componentDidMount() {
    this.fetchJobs(TabsData[this.state.activeTab].query);
  }

  componentDidUpdate(_, prevState) {
    if (prevState.activeTab !== this.state.activeTab) {
      this.fetchJobs(TabsData[this.state.activeTab].query);
    }
  }

  fetchJobs = async (query) => {
    this.setState({ isLoading: true });
    const { spaceId, environmentId, contentTypes } = this.props;
    const spaceEndpoint = EndpointFactory.createSpaceEndpoint(spaceId, environmentId);

    const jobsData = await getJobsData(spaceEndpoint, {
      ...query,
      'environment.sys.id': environmentId,
    }).catch((error) => {
      logger.logError('Unexpected error loading scheduled actions', {
        error,
        message: error.message,
      });
      this.setState({
        isError: true,
        isLoading: false,
      });
    });

    if (!jobsData) {
      return;
    }

    const { jobs, entries, users, nextQuery } = jobsData;
    const { scheduleData } = this.state;

    const newJobs = _.uniqBy(scheduleData.jobs.concat(jobs), 'sys.id');
    this.setState({
      isLoading: false,
      isInitialLoad: false,
      scheduleData: {
        jobs: newJobs,
        entries: { ...scheduleData.entries, ...normalizeCollection(entries) },
        users: { ...scheduleData.users, ...normalizeCollection(users) },
        contentTypes: { ...scheduleData.contentTypes, ...normalizeCollection(contentTypes) },
      },
      pageNext: getQueryStringParams(nextQuery).pageNext,
    });
  };

  renderJobs = () => {
    const { activeTab, pageNext, scheduleData, isLoading, isInitialLoad, isError } = this.state;
    const { defaultLocale } = this.props;
    if (isLoading && isInitialLoad) {
      return <JobsListPageLoading />;
    }

    if (isError) {
      return <UnknownErrorMessage data-test-id="cf-ui-jobs-state-error" />;
    }

    if (!scheduleData.jobs.length) {
      return (
        <ScheduledActionsEmptyStateMessage
          title={TabsData[activeTab].emptyStateMessage.title}
          text={TabsData[activeTab].emptyStateMessage.text}
        />
      );
    }

    return (
      <>
        {activeTab !== TabTypes.ErroredJobs ? (
          <ScheduledActionsSchedule
            jobs={scheduleData.jobs}
            entriesData={scheduleData.entries}
            usersData={scheduleData.users}
            emptyStateMessage={TabsData[activeTab].emptyStateMessage}
            contentTypesData={scheduleData.contentTypes}
          />
        ) : (
          <ScheduledActionsTable
            description={TabsData[activeTab].description}
            jobs={scheduleData.jobs}
            entriesData={scheduleData.entries}
            usersData={scheduleData.users}
            contentTypesData={scheduleData.contentTypes}
            defaultLocale={defaultLocale}
          />
        )}
        {pageNext && (
          <div className={styles.loadMoreButtonWrapper}>
            <Button
              buttonType="naked"
              loading={isLoading}
              disabled={isLoading || isError}
              onClick={() => {
                this.fetchJobs({
                  ...TabsData[activeTab].query,
                  pageNext,
                });
              }}>
              Load more
            </Button>
          </div>
        )}
      </>
    );
  };

  render() {
    const { activeTab } = this.state;
    return (
      <JobsListShell>
        <DocumentTitle title="Scheduled Content" />
        <Tabs withDivider>
          {Object.entries(TabsData).map(([key, tab]) => (
            <Tab
              key={key}
              selected={activeTab === key}
              id={key}
              onSelect={(id) => {
                if (id !== activeTab) {
                  this.setState({
                    ...this.initialState,
                    activeTab: id,
                  });
                }
              }}>
              {tab.title}
            </Tab>
          ))}
        </Tabs>
        <TabPanel className={styles.tabPanel} id={activeTab}>
          {this.renderJobs()}
        </TabPanel>
      </JobsListShell>
    );
  }
}

JobsListPage.propTypes = {
  spaceId: PropTypes.string.isRequired,
  environmentId: PropTypes.string.isRequired,
  contentTypes: PropTypes.array.isRequired,
  defaultLocale: PropTypes.object.isRequired,
  activeTab: PropTypes.oneOf(Object.keys(TabTypes)),
};

JobsListPage.defaultProps = {
  activeTab: TabTypes.ScheduledJobs,
};

export default JobsListPage;
