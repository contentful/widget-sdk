import React from 'react';
import { AppsFrameworkIntroBanner } from '../AppsFrameworkIntroBanner';
import { FLAGS, getVariation } from 'LaunchDarkly';
import { get, partition } from 'lodash';
import {
  Icon,
  Note,
  Notification,
  Paragraph,
  TextLink,
} from '@contentful/forma-36-react-components';

import DocumentTitle from 'components/shared/DocumentTitle';
import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';

import { AppDetailsModal } from '../AppDetailsModal';
import * as AppLifecycleTracking from '../AppLifecycleTracking';
import { isUsageExceeded } from '../utils';
import { ADVANCED_APPS_LIMIT, BASIC_APPS_LIMIT } from '../limits';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';

import { AppsListShell } from './AppListShell';
import { MarketplacePageLoading } from './MarketplacePageLoading';
import { styles } from './styles';
import { AppList } from './AppList';
import { MarketplaceApp } from 'features/apps-core';
import { ContentfulAppsList } from './ContentfulAppList';
import { AppManager } from '../AppOperations';

const withInAppHelpUtmBuildApps = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'build-apps',
  campaign: 'in-app-help',
});

const sortPrivateAppsFirst = (listOfApps, canManageApps) => {
  // only sort private apps first if user can manage them
  if (!canManageApps) {
    return listOfApps;
  }

  const [privApps, pubApps] = partition(listOfApps, (a) => !!a.isPrivateApp);
  return [...privApps, ...pubApps];
};

const getEnabledApps = async (apps, flagContext) => {
  const appsFeatureFlagStatuses = await Promise.all(
    apps.map((app) => {
      const hasValidFlag = app.featureFlagName && FLAGS[app.featureFlagName];
      return hasValidFlag ? getVariation(FLAGS[app.featureFlagName], flagContext) : true;
    })
  );
  return apps.filter((_, index) => appsFeatureFlagStatuses[index]);
};

const openDetailModal = ({
  appManager,
  spaceInformation,
  usageExceeded,
  canManageApps,
  hasAdvancedAppsFeature,
}) => (app) => {
  AppLifecycleTracking.detailsOpened(app.id);

  ModalLauncher.open(({ isShown, onClose }) => (
    <AppDetailsModal
      isShown={isShown}
      onClose={onClose}
      app={app}
      appManager={appManager}
      spaceInformation={spaceInformation}
      usageExceeded={usageExceeded}
      hasAdvancedAppsFeature={hasAdvancedAppsFeature}
      canManageApps={canManageApps}
    />
  ));
};

interface MarketplacePageProps {
  cma: any;
  repo: {
    getApps: () => Promise<MarketplaceApp[]>;
  };
  organizationId: string;
  spaceInformation: {
    spaceId: string;
    spaceName: string;
    envMeta: {
      environmentId: string;
      isMasterEnvironment: boolean;
      aliasId?: string;
    };
  };
  userId: string;
  hasAppsFeature: boolean;
  hasAdvancedAppsFeature: boolean;
  deeplinkAppId?: string;
  canManageApps?: boolean;
}

interface MarketplacePageState {
  ready: boolean;
  installedApps: MarketplaceApp[];
  availableApps: MarketplaceApp[];
  contentfulApps: MarketplaceApp[];
  appManager: AppManager | null;
}

export class MarketplacePage extends React.Component<MarketplacePageProps, MarketplacePageState> {
  state = {
    ready: false,
    installedApps: [],
    availableApps: [],
    contentfulApps: [],
    appManager: null,
  } as MarketplacePageState;

  async loadApps() {
    const environmentId = this.props.spaceInformation.envMeta.environmentId;
    const spaceId = this.props.spaceInformation.spaceId;
    const apps = await this.props.repo.getApps();
    const enabledApps = await getEnabledApps(apps, {
      spaceId,
      environmentId,
      organizationId: this.props.organizationId,
    });

    const [contentfulApps, marketplaceApps] = partition(enabledApps, (app) => app.isContentfulApp);
    const [installedApps, availableApps] = partition(marketplaceApps, (app) => app.appInstallation);
    return { availableApps, installedApps, contentfulApps };
  }

  async componentDidMount() {
    try {
      const environmentId = this.props.spaceInformation.envMeta.environmentId;
      const spaceId = this.props.spaceInformation.spaceId;

      const appState = await this.loadApps();

      const appManager = new AppManager(this.props.cma, environmentId, spaceId, async () => {
        const appState = await this.loadApps();
        this.setState(appState);
      });

      this.setState({ ready: true, appManager, ...appState }, () => {
        this.openDeeplinkedAppDetails();
      });
    } catch (err) {
      Notification.error('Failed to load apps.');
    }
  }

  openDeeplinkedAppDetails() {
    const {
      deeplinkAppId,
      hasAppsFeature,
      spaceInformation,
      canManageApps,
      hasAdvancedAppsFeature,
    } = this.props;
    const { appManager } = this.state;

    if (!hasAppsFeature || !deeplinkAppId) {
      return;
    }

    const { installedApps, availableApps } = this.state;

    const deeplinkedApp = installedApps.concat(availableApps).find((app) => {
      // Find either by marketplace ID ("slug", pretty)
      // or definition ID (Contentful UUID, ugly).
      const byMarketplaceId = app.id === deeplinkAppId;
      const definitionId = get(app, ['appDefinition', 'sys', 'id']);
      const byDefinitionId = definitionId === deeplinkAppId;

      return byMarketplaceId || byDefinitionId;
    });

    if (deeplinkedApp && !deeplinkedApp.isPrivateApp) {
      // TODO: we could potentially track the deeplink.
      // Use `this.props.deeplinkReferrer`.
      openDetailModal({
        appManager,
        spaceInformation,
        usageExceeded: isUsageExceeded(installedApps, hasAdvancedAppsFeature),
        hasAdvancedAppsFeature,
        canManageApps,
      })(deeplinkedApp);
    }
  }

  render() {
    const {
      organizationId,
      spaceInformation,
      hasAppsFeature,
      hasAdvancedAppsFeature,
      canManageApps = false,
    } = this.props;
    const { installedApps, availableApps, contentfulApps, appManager } = this.state;

    let content = <MarketplacePageLoading />;

    if (this.state.ready) {
      const hasInstalledApps = installedApps.length > 0;
      const hasAvailableApps = availableApps.length > 0;
      const hasCtflApps = contentfulApps.length > 0;
      const spaceInstallationLimit = hasAdvancedAppsFeature
        ? ADVANCED_APPS_LIMIT
        : BASIC_APPS_LIMIT;
      const usageExceeded = isUsageExceeded(installedApps, hasAdvancedAppsFeature);
      content = (
        <>
          {hasCtflApps && (
            <ContentfulAppsList
              apps={contentfulApps}
              appManager={this.state.appManager}
              canManageApps={canManageApps}
              openDetailModal={openDetailModal({
                appManager,
                spaceInformation,
                usageExceeded,
                hasAdvancedAppsFeature,
                canManageApps,
              })}
            />
          )}
          {hasInstalledApps ? (
            <AppList
              apps={sortPrivateAppsFirst(installedApps, canManageApps)}
              appManager={appManager!}
              openDetailModal={openDetailModal({
                appManager,
                spaceInformation,
                canManageApps,
                usageExceeded,
                hasAdvancedAppsFeature,
              })}
              hasAdvancedAppsFeature={hasAdvancedAppsFeature}
              canManageApps={canManageApps}
              organizationId={organizationId}
              title="Installed"
              info={`Usage: ${installedApps.length} / ${spaceInstallationLimit} apps installed`}
              testId="installed-list"
            />
          ) : (
            <AppsFrameworkIntroBanner canManageApps={canManageApps} />
          )}
          {hasInstalledApps && (
            <Note className={styles.feedbackNote}>
              <TextLink
                target="_blank"
                rel="noopener noreferrer"
                href="https://ctfl.io/apps-feedback">
                Give us feedback!
              </TextLink>{' '}
              Help us improve your experience with our apps and the App Framework.
            </Note>
          )}
          {hasAvailableApps && (
            <AppList
              apps={sortPrivateAppsFirst(availableApps, canManageApps)}
              appManager={appManager!}
              openDetailModal={openDetailModal({
                appManager,
                spaceInformation,
                usageExceeded,
                hasAdvancedAppsFeature,
                canManageApps,
              })}
              hasAdvancedAppsFeature={hasAdvancedAppsFeature}
              canManageApps={!!canManageApps}
              organizationId={organizationId}
              title="Available"
            />
          )}
          <Paragraph className={styles.footer}>
            Can&rsquo;t find what you&rsquo;re looking for?{' '}
            <TextLink
              href={withInAppHelpUtmBuildApps(
                'https://www.contentful.com/developers/docs/extensibility/app-framework/tutorial/'
              )}
              target="_blank"
              className={styles.externalLink}
              rel="noopener noreferrer">
              Build your own app
              <Icon icon="ExternalLink" />
            </TextLink>
          </Paragraph>
        </>
      );
    }

    return (
      <>
        <DocumentTitle title="Apps" />
        <AppsListShell organizationId={organizationId} appsFeatureDisabled={!hasAppsFeature}>
          {content}
        </AppsListShell>
      </>
    );
  }
}
