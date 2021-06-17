import React from 'react';
import { AppsFrameworkIntroBanner } from '../AppsFrameworkIntroBanner';
import { FLAGS, getVariation } from 'core/feature-flags';
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
import { OrganizationFeatures, getOrgFeature } from 'data/CMA/ProductCatalog';
import { AppsListShell } from './AppListShell';
import { MarketplacePageLoading } from './MarketplacePageLoading';
import { styles } from './styles';
import { AppList } from './AppList';
import { MarketplaceApp } from 'features/apps-core';
import { ContentfulAppsList } from './ContentfulAppList';
import { AppManager } from '../AppOperations';
import { SpaceInformation } from '../AppDetailsModal/shared';
import { useAppsTrial } from 'features/trials';
import { useSearchParams } from 'core/react-routing';
import { getEnvironmentMeta } from 'core/services/SpaceEnvContext/utils';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { EnvironmentMeta } from 'core/services/SpaceEnvContext/types';
import { useCurrentSpaceAPIClient } from 'core/services/APIClient/useCurrentSpaceAPIClient';

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
  canManageApps?: boolean;
  hasAdvancedAppsFeature: boolean;
  hasAppsFeature: boolean;
  repo: {
    getAllApps: () => Promise<MarketplaceApp[]>;
  };
}

export function MarketplacePage(props: MarketplacePageProps) {
  const {
    currentEnvironmentId: environmentId,
    currentSpaceId: spaceId,
    currentOrganizationId: organizationId,
    currentSpaceName: spaceName,
    currentSpace,
  } = useSpaceEnvContext();
  const { client: cma } = useCurrentSpaceAPIClient();
  const [searchParams] = useSearchParams();
  const [ready, setReady] = React.useState(false);
  const [installedApps, setInstalledApps] = React.useState<MarketplaceApp[]>([]);
  const [availableApps, setAvailableApps] = React.useState<MarketplaceApp[]>([]);
  const [contentfulApps, setContentfulApps] = React.useState<MarketplaceApp[]>([]);
  const [appManager, setAppManager] = React.useState<AppManager | null>(null);
  const [appDetailsModalAppId, setAppDetailsModalAppId] = React.useState<string | null>(
    searchParams.get('app') ?? null
  );
  const [isPurchased, setIsPurchased] = React.useState(false);
  const spaceInformation: SpaceInformation = {
    envMeta: getEnvironmentMeta(currentSpace) as EnvironmentMeta,
    spaceId: spaceId as string,
    spaceName: spaceName as string,
  };
  const canManageApps = props.canManageApps ?? false;

  const { canStartTrial: isTrialAvailable } = useAppsTrial(organizationId);

  React.useEffect(() => {
    async function init() {
      try {
        const [launchApp, composeApp, appManager] = await Promise.all([
          getOrgFeature(organizationId, OrganizationFeatures.PC_ORG_LAUNCH_APP, false),
          getOrgFeature(organizationId, OrganizationFeatures.PC_ORG_COMPOSE_APP, false),
          new AppManager(cma, environmentId, spaceId, organizationId, async () => await loadApps()),
          loadApps(),
        ]);
        const isPurchased = [launchApp, composeApp].some(Boolean);

        setAppManager(appManager);
        setIsPurchased(isPurchased);

        setReady(true);
      } catch (err) {
        Notification.error('Failed to load apps.');
      }
    }
    init();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadApps() {
    const apps = await props.repo.getAllApps();
    const enabledApps = await getEnabledApps(apps, {
      spaceId,
      environmentId,
      organizationId,
    });

    const [contentfulApps, marketplaceApps] = partition(enabledApps, (app) => app.isContentfulApp);
    const [installedApps, availableApps] = partition(marketplaceApps, (app) => app.appInstallation);

    setAvailableApps(availableApps);
    setInstalledApps(installedApps);
    setContentfulApps(contentfulApps);
  }

  async function openDetailModal(app: MarketplaceApp) {
    AppLifecycleTracking.detailsOpened(app.id);
    setAppDetailsModalAppId(app.id);
  }

  async function closeDetailModal() {
    loadApps();
    setAppDetailsModalAppId(null);
  }

  function renderModal() {
    if (!props.hasAppsFeature || !appDetailsModalAppId || !appManager) {
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
        onClose={closeDetailModal}
        app={modalApp}
        appManager={appManager}
        spaceInformation={spaceInformation}
        usageExceeded={isUsageExceeded(installedApps, props.hasAdvancedAppsFeature)}
        hasAdvancedAppsFeature={props.hasAdvancedAppsFeature}
        canManageApps={canManageApps}
      />
    );
  }

  let content = <MarketplacePageLoading />;

  if (ready) {
    if (!appManager) return null;

    const hasInstalledApps = installedApps.length > 0;
    const hasAvailableApps = availableApps.length > 0;
    const spaceInstallationLimit = props.hasAdvancedAppsFeature
      ? ADVANCED_APPS_LIMIT
      : BASIC_APPS_LIMIT;
    content = (
      <>
        <ContentfulAppsList
          apps={contentfulApps}
          appManager={appManager}
          canManageApps={canManageApps}
          openDetailModal={openDetailModal}
          spaceInformation={spaceInformation}
          organizationId={organizationId as string}
          isPurchased={isPurchased}
          isTrialAvailable={isTrialAvailable}
        />
        {hasInstalledApps ? (
          <AppList
            apps={sortPrivateAppsFirst(installedApps, canManageApps)}
            appManager={appManager}
            openDetailModal={openDetailModal}
            canManageApps={canManageApps}
            organizationId={organizationId as string}
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
            openDetailModal={openDetailModal}
            canManageApps={!!canManageApps}
            organizationId={organizationId as string}
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
      <AppsListShell
        organizationId={organizationId as string}
        appsFeatureDisabled={!props.hasAppsFeature}>
        {content}
      </AppsListShell>
      {renderModal()}
    </>
  );
}
