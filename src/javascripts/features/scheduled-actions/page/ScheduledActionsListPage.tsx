import React, { Component } from 'react';
import _ from 'lodash';
import { css } from 'emotion';
import { Button, Tabs, Tab, TabPanel } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import UnknownErrorMessage from 'components/shared/UnknownErrorMessage';
import DocumentTitle from 'components/shared/DocumentTitle';
import getQueryStringParams from 'utils/getQueryStringParams';
import * as EndpointFactory from 'data/EndpointFactory';
import { captureError } from 'core/monitoring';

import { ScheduledActionsTable } from './ScheduledActionsTable';
import { getJobsData } from './ScheduledActionsListService';
import { ScheduledActionsEmptyStateMessage } from './ScheduledActionsEmptyStateMessage';
import { ScheduledActionsSchedule } from './ScheduledActionsSchedule';
import { User } from '@sentry/types';
import { JobsListShell } from './ScheduledActionsListShell';
import {
  AssetProps,
  EntryProps,
  LocaleProps,
  ScheduledActionProps,
} from 'contentful-management/types';
import { ScheduledActionsListPageLoading } from '../skeletons/ScheduledActionsListSkeleton';
import { TabsData, TabTypes } from './tabs';
import { ContentType } from 'core/services/SpaceEnvContext/types';
import { Release } from '@contentful/types';

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
  tabPanel: css({
    paddingTop: tokens.spacingL,
  }),
  loadMoreButtonWrapper: css({
    display: 'flex',
    justifyContent: 'center',
  }),
};

type ScheduledActionsListPageProps = {
  activeTab: keyof typeof TabTypes;
  spaceId: string;
  environmentId: string;
  contentTypes: ContentType[];
  defaultLocale: LocaleProps;
};

type ScheduledActionsListPageState = {
  isError: boolean;
  isInitialLoad: boolean;
  isLoading: boolean;
  jobCount: number;
  scheduleData: {
    jobs: ScheduledActionProps[];
    entries: Record<string, EntryProps>;
    assets: Record<string, AssetProps>;
    releases: Record<string, Release>;
    users: Record<string, User>;
    contentTypes: Record<string, ContentType>;
  };
  activeTab: keyof typeof TabTypes;
  nextQuery: any;
  pageNext: any;
};

const initialState = {
  isError: false,
  isInitialLoad: true,
  isLoading: false,
  jobCount: 0,
  scheduleData: {
    jobs: [],
    entries: {},
    assets: {},
    releases: {},
    users: {},
    contentTypes: {},
  },
  pageNext: {},
};

class ScheduledActionsListPage extends Component<
  ScheduledActionsListPageProps,
  ScheduledActionsListPageState
> {
  static defaultProps = {
    activeTab: TabTypes.ScheduledJobs,
  };

  constructor(props) {
    super(props);

    this.state = {
      ...initialState,
      activeTab: props.activeTab,
      nextQuery: TabsData[props.activeTab].query,
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

    try {
      const jobsData = await getJobsData({ environmentId }, spaceEndpoint, query);

      const { jobs, entries, assets, releases, users, nextQuery } = jobsData;
      const { scheduleData } = this.state;

      const newJobs = _.uniqBy(scheduleData.jobs.concat(jobs), 'sys.id');
      this.setState({
        isLoading: false,
        isInitialLoad: false,
        scheduleData: {
          jobs: newJobs,
          entries: {
            ...scheduleData.entries,
            ...(entries && normalizeCollection(entries)),
          } as Record<string, EntryProps>,
          assets: { ...scheduleData.assets, ...(assets && normalizeCollection(assets)) } as Record<
            string,
            AssetProps
          >,
          releases: {
            ...scheduleData.releases,
            ...(releases && normalizeCollection(releases)),
          } as Record<string, Release>,
          users: { ...scheduleData.users, ...normalizeCollection(users) } as Record<string, User>,
          contentTypes: {
            ...scheduleData.contentTypes,
            ...normalizeCollection(contentTypes),
          } as Record<string, ContentType>,
        },
        pageNext: getQueryStringParams(nextQuery).pageNext,
      });
    } catch (error) {
      captureError(error);
      this.setState({
        isError: true,
        isLoading: false,
      });
    }
  };

  renderJobs = () => {
    const { activeTab, pageNext, scheduleData, isLoading, isInitialLoad, isError } = this.state;
    const { defaultLocale } = this.props;
    if (isLoading && isInitialLoad) {
      return <ScheduledActionsListPageLoading />;
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

    const entitiesById = {
      ...scheduleData.entries,
      ...scheduleData.assets,
      ...scheduleData.releases,
    } as Record<string, EntryProps | AssetProps | Release>;

    return (
      <>
        {activeTab !== TabTypes.ErroredJobs ? (
          <ScheduledActionsSchedule
            scheduledActions={scheduleData.jobs}
            entitiesById={entitiesById}
            emptyStateMessage={TabsData[activeTab].emptyStateMessage}
            contentTypesById={scheduleData.contentTypes}
          />
        ) : (
          <ScheduledActionsTable
            description={TabsData[activeTab].description}
            scheduledActions={scheduleData.jobs}
            entitiesById={entitiesById}
            contentTypesById={scheduleData.contentTypes}
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
                    ...initialState,
                    activeTab: id as keyof typeof TabTypes,
                    nextQuery: TabsData[id].query,
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

export { ScheduledActionsListPage };
