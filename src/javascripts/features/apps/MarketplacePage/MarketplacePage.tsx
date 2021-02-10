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
import { AppDetailsModal } from '../AppDetailsModal';
import * as AppLifecycleTracking from '../AppLifecycleTracking';
import { isUsageExceeded } from '../utils';
import { ADVANCED_APPS_LIMIT, BASIC_APPS_LIMIT } from '../limits';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';
import { FEATURES, getOrgFeature } from 'data/CMA/ProductCatalog';
import { AppsListShell } from './AppListShell';
import { MarketplacePageLoading } from './MarketplacePageLoading';
import { styles } from './styles';
import { AppList } from './AppList';
import { MarketplaceApp } from 'features/apps-core';
import { ContentfulAppsList } from './ContentfulAppList';
import { AppManager } from '../AppOperations';
import { SpaceInformation } from '../AppDetailsModal/shared';

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

export interface MarketplacePageProps {
  cma: any;
  repo: {
    getApps: () => Promise<MarketplaceApp[]>;
  };
  organizationId: string;
  spaceInformation: SpaceInformation;
  userId: string;
  hasAppsFeature: boolean;
  hasAdvancedAppsFeature: boolean;
  canManageApps?: boolean;

  detailsModalAppId?: string;
  openAppDetails: (app: MarketplaceApp) => Promise<void> | void;
  closeAppDetails: () => Promise<void> | void;
}

interface MarketplacePageState {
  ready: boolean;
  installedApps: MarketplaceApp[];
  availableApps: MarketplaceApp[];
  contentfulApps: MarketplaceApp[];
  appManager: AppManager;
  appDetailsModalAppId: string | null;
  isPurchased: boolean;
}

export class MarketplacePage extends React.Component<MarketplacePageProps, MarketplacePageState> {
  constructor(props: MarketplacePageProps) {
    super(props);

    const environmentId = this.props.spaceInformation.envMeta.environmentId;
    const spaceId = this.props.spaceInformation.spaceId;
    const appManager = new AppManager(
      this.props.cma,
      environmentId,
      spaceId,
      this.props.organizationId,
      async () => {
        const appState = await this.loadApps();
        this.setState(appState);
      }
    );

    this.state = {
      ready: false,
      installedApps: [],
      availableApps: [],
      contentfulApps: [],
      appManager,
      appDetailsModalAppId: props.detailsModalAppId,
      isPurchased: false,
    } as MarketplacePageState;
  }

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
      const appState = await this.loadApps();
      const isPurchased = (
        await Promise.all([
          getOrgFeature(this.props.organizationId, FEATURES.PC_ORG_LAUNCH_APP, false),
          getOrgFeature(this.props.organizationId, FEATURES.PC_ORG_COMPOSE_APP, false),
        ])
      ).some(Boolean);
      this.setState({ ready: true, ...appState, isPurchased });
    } catch (err) {
      Notification.error('Failed to load apps.');
    }
  }

  openDetailModal = async (app: MarketplaceApp) => {
    AppLifecycleTracking.detailsOpened(app.id);
    this.setState({ appDetailsModalAppId: app.id });
    await this.props.openAppDetails(app);
  };

  closeDetailModal = async () => {
    this.setState({ appDetailsModalAppId: null });
    await this.props.closeAppDetails();
  };

  renderModal() {
    const {
      spaceInformation,
      hasAppsFeature,
      hasAdvancedAppsFeature,
      canManageApps = false,
    } = this.props;
    const {
      appManager,
      appDetailsModalAppId,
      installedApps,
      availableApps,
      contentfulApps,
    } = this.state;

    if (!hasAppsFeature || !appDetailsModalAppId) {
      return null;
    }

    const modalApp = [...installedApps, ...availableApps, ...contentfulApps].find((app) => {
      // Find either by marketplace ID ("slug", pretty)
      // or definition ID (Contentful UUID, ugly).
      const byMarketplaceId = app.id === appDetailsModalAppId;
      const definitionId = get(app, ['appDefinition', 'sys', 'id']);
      const byDefinitionId = definitionId === appDetailsModalAppId;

      return byMarketplaceId || byDefinitionId;
    });

    if (!modalApp) {
      return null;
    }

    return (
      <AppDetailsModal
        isShown={true}
        onClose={this.closeDetailModal}
        app={modalApp}
        appManager={appManager}
        spaceInformation={spaceInformation}
        usageExceeded={isUsageExceeded(installedApps, hasAdvancedAppsFeature)}
        hasAdvancedAppsFeature={hasAdvancedAppsFeature}
        canManageApps={canManageApps}
      />
    );
  }

  render() {
    const {
      organizationId,
      hasAppsFeature,
      hasAdvancedAppsFeature,
      canManageApps = false,
      spaceInformation,
    } = this.props;
    const { installedApps, availableApps, contentfulApps, appManager } = this.state;

    let content = <MarketplacePageLoading />;

    if (this.state.ready) {
      const hasInstalledApps = installedApps.length > 0;
      const hasAvailableApps = availableApps.length > 0;
      const spaceInstallationLimit = hasAdvancedAppsFeature
        ? ADVANCED_APPS_LIMIT
        : BASIC_APPS_LIMIT;
      content = (
        <>
          <ContentfulAppsList
            apps={contentfulApps}
            appManager={this.state.appManager}
            canManageApps={canManageApps}
            openDetailModal={this.openDetailModal}
            spaceInformation={spaceInformation}
            organizationId={organizationId}
            isPurchased={this.state.isPurchased}
          />
          {hasInstalledApps ? (
            <AppList
              apps={sortPrivateAppsFirst(installedApps, canManageApps)}
              appManager={appManager}
              openDetailModal={this.openDetailModal}
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
              appManager={appManager}
              openDetailModal={this.openDetailModal}
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
        {this.renderModal()}
      </>
    );
  }
}
