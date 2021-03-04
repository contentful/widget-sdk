import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { css } from 'emotion';
import {
  Icon,
  SkeletonContainer,
  SkeletonText,
  Tabs,
  Tab,
  TabPanel,
  Workbench,
  Button,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import DocumentTitle from 'components/shared/DocumentTitle';
import UnknownErrorMessage from 'components/shared/UnknownErrorMessage';
import { releaseDetailNavigation } from '../ReleaseDetail/utils';
import ReleasesEmptyStateMessage from './ReleasesEmptyStateMessage';
import { getReleaseActions, getReleases } from '../releasesService';
import ReleasesTimeline from './ReleasesTimeline';
import ReleasesListdialog from './ReleasesListDialog';
import { LaunchAppDeepLink } from '../ReleasesWidget/LaunchAppDeepLink';
import { IfAppInstalled } from 'features/contentful-apps';

const styles = {
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
  deepLinkHeader: css({
    height: tokens.spacing2Xl,
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

export const ReleasesPageLoading = () => (
  <SkeletonContainer svgWidth="100%" svgHeight={300} ariaLabel="Loading releases list...">
    <SkeletonText offsetTop={20} offsetLeft={0} lineHeight={20} width="100%" />
    <ItemSkeleton baseTop={50} />
    <SkeletonText offsetTop={170} offsetLeft={0} lineHeight={20} width="100%" />
    <ItemSkeleton baseTop={200} />
  </SkeletonContainer>
);

export const TabTypes = {
  UpcomingReleases: 'UpcomingReleases',
  PastReleases: 'PastReleases',
};

const TabsData = {
  [TabTypes.UpcomingReleases]: {
    title: 'Upcoming',
    emptyStateMessage: {
      title: 'No upcoming releases at the moment',
      text: 'Upcoming releases will show up here',
    },
  },
  [TabTypes.PastReleases]: {
    title: 'Past',
    emptyStateMessage: {
      title: 'No releases have been released yet',
      text: 'Past releases will show up here',
    },
  },
};

const PageShell = ({ children, setIsRelaseDialogShown }) => {
  return (
    <IfAppInstalled appId="launch">
      <Workbench>
        <Workbench.Header
          icon={<Icon icon="Release" color="positive" size="large" />}
          title="Content releases"
          onBack={() => window.history.back()}
          actions={
            <Button
              buttonType="primary"
              testId="create-new-release"
              onClick={() => setIsRelaseDialogShown(true)}>
              Create new Release
            </Button>
          }
        />
        <Workbench.Header
          className={styles.deepLinkHeader}
          title={<LaunchAppDeepLink eventOrigin="release-list-page" />}
        />
        <Workbench.Content type="text" className={styles.workbenchContent}>
          <div>{children}</div>
        </Workbench.Content>
      </Workbench>
    </IfAppInstalled>
  );
};

PageShell.propTypes = {
  setIsRelaseDialogShown: PropTypes.func,
};

class ReleasesListPage extends Component {
  constructor(props) {
    super(props);

    this.initialState = {
      isError: false,
      isLoading: false,
      activeTab: props.activeTab,
      releases: {
        [TabTypes.PastReleases]: [],
        [TabTypes.UpcomingReleases]: [],
      },
      lastActions: [],
      isReleaseDialogShown: false,
    };

    this.state = { ...this.initialState };
    this.fetchReleases = this.fetchReleases.bind(this);
    this.onReleaseSelect = this.onReleaseSelect.bind(this);
    this.handleCreateNewReleaseDialog = this.handleCreateNewReleaseDialog.bind(this);
  }

  componentDidMount() {
    this.fetchReleases();
  }

  fetchReleases() {
    this.setState({ isLoading: true });

    getReleases()
      .then((fetchedReleases) => {
        const releases = {
          [TabTypes.UpcomingReleases]: fetchedReleases.items.filter(
            (release) => !release.sys.lastAction
          ),
          [TabTypes.PastReleases]: fetchedReleases.items.filter(
            (release) => release.sys.lastAction
          ),
        };

        const actionsToFetch = releases[TabTypes.PastReleases].map((release) => ({
          releaseId: release.sys.id,
          actionId: release.sys.lastAction.sys.id,
        }));

        getReleaseActions(actionsToFetch).then((lastActions) => {
          this.setState({ ...this.state, lastActions });
        });

        this.setState({ ...this.state, isLoading: false, releases });
      })
      .catch(() => {
        this.setState({ ...this.state, isError: true, isLoading: false });
      });
  }

  selectTab = (id) => {
    if (id !== this.state.activeTab) {
      this.setState({ ...this.state, activeTab: id });
    }
  };

  onReleaseSelect(release) {
    releaseDetailNavigation(release);
  }

  handleCreateNewReleaseDialog(isReleaseDialogShown) {
    this.setState({ isReleaseDialogShown });
  }

  renderReleases() {
    const { activeTab, releases, lastActions } = this.state;

    if (releases[activeTab].length) {
      return (
        <ReleasesTimeline
          releases={releases[activeTab]}
          lastActions={lastActions}
          onDeleteRelease={this.fetchReleases}
          onReleaseSelect={this.onReleaseSelect}
        />
      );
    }

    const { title, text } = TabsData[activeTab].emptyStateMessage;
    return <ReleasesEmptyStateMessage testId="releases" title={title} text={text} />;
  }

  render() {
    const { activeTab, isLoading, isError } = this.state;

    return (
      <PageShell setIsRelaseDialogShown={this.handleCreateNewReleaseDialog}>
        <DocumentTitle title="Content Releases" />
        <Tabs withDivider>
          {Object.entries(TabsData).map(([key, tab]) => (
            <Tab key={key} selected={activeTab === key} id={key} onSelect={this.selectTab}>
              {tab.title}
            </Tab>
          ))}
        </Tabs>
        <TabPanel className={styles.tabPanel} id={activeTab}>
          {isError && <UnknownErrorMessage data-test-id="cf-ui-releases-state-error" />}
          {isLoading && <ReleasesPageLoading />}
          {!isError && !isLoading && this.renderReleases()}
        </TabPanel>
        {this.state.isReleaseDialogShown && (
          <ReleasesListdialog
            onCreateRelease={this.fetchReleases}
            onCancel={() => this.setState({ isReleaseDialogShown: false })}
          />
        )}
      </PageShell>
    );
  }
}

ReleasesListPage.propTypes = {
  activeTab: PropTypes.oneOf(Object.keys(TabTypes)),
};

ReleasesListPage.defaultProps = {
  activeTab: TabTypes.UpcomingReleases,
};

export default ReleasesListPage;
