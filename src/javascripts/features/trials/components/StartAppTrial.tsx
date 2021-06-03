import React, { useEffect } from 'react';
import { css, cx } from 'emotion';
import { contentImport, startAppTrial } from '../services/AppTrialService';
import { getAppsRepo } from 'features/apps-core';
import { AppManager } from 'features/apps';
import * as TokenStore from 'services/TokenStore';
import { clearCachedProductCatalogFlags } from 'data/CMA/ProductCatalog';
import { go } from 'states/Navigator';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';
import { Heading, Typography, Notification } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { captureError } from 'core/monitoring';
import EmptyStateContainer, {
  defaultSVGStyle,
} from 'components/EmptyStateContainer/EmptyStateContainer';
import StartAppTrialIllustration from 'svg/illustrations/start-app-trial-illustration.svg';
import { getSpaceAutoCreatedKey } from 'components/shared/auto_create_new_space/getSpaceAutoCreatedKey';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import {
  AppInstallationError,
  ContentImportError,
  TrialSpaceServerError,
} from '../utils/AppTrialError';
import { capitalizeFirst } from 'utils/StringUtils';
import { getSpaceContext } from 'classes/spaceContext';
import { router, useSearchParams } from 'core/react-routing';

const styles = {
  emptyContainer: css({
    alignItems: 'center',
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
    div: {
      maxWidth: 'unset',
    },
    h1: {
      marginBottom: tokens.spacingXs,
    },
  }),
  fullScreen: css({
    backgroundColor: tokens.colorWhite,
    zIndex: tokens.zIndexModal,
    position: 'fixed',
    height: '100%',
  }),
};

export interface StartAppTrialProps {
  orgId: string;
  existingUsers?: boolean;
  from?: string;
}

type ResultWithAppName = PromiseSettledResult<void> & { app: string };

const markOnboarding = async () => {
  const store = getBrowserStorage();
  const user = await TokenStore.getUser();
  store.set(getSpaceAutoCreatedKey(user, 'success'), true);
};

const goToSpaceHome = (spaceId: string) =>
  go({
    path: ['spaces', 'detail'],
    params: {
      spaceId,
    },
    options: { location: 'replace' },
  });

const goToSubscriptionPage = (orgId: string) => {
  router.navigate({ path: 'organizations.subscription.overview', orgId }, { location: 'replace' });
};

const installApps = async (
  apps: string[] = [],
  orgId: string,
  spaceId: string,
  environmentId: string,
  cma: unknown
) => {
  const appRepos = await Promise.all(apps.map(getAppsRepo().getAppByIdOrSlug)).catch((error) => {
    captureError(new Error(`Failed to get app definitions during apps trial`), {
      extra: {
        originalError: error,
      },
    });
    throw new AppInstallationError('all');
  });

  const appsManager = new AppManager(cma, environmentId, spaceId, orgId);

  await Promise.allSettled(appRepos.map((app) => appsManager.installApp(app, true, false))).then(
    (results) => {
      const failedApps = results.filter((r) => r.status === 'rejected') as ResultWithAppName[];

      if (!failedApps.length) {
        return;
      }

      results.forEach((result, i) => {
        const appName = apps[i];
        (result as ResultWithAppName).app = appName;
        if (result.status === 'rejected') {
          captureError(new Error(`Failed to install ${appName} during apps trial`), {
            extra: {
              reason: result.reason,
            },
          });
        }
      });

      throw new AppInstallationError(failedApps.length === apps.length ? 'all' : failedApps[0].app);
    }
  );
};

const trialBootstrap = async (organizationId: string, existingUsers: boolean, from: string) => {
  const startTimeTracker = window.performance.now();

  let isSuccessful = false;

  const spaceContext = getSpaceContext();
  try {
    const { trialSpace, apps } = await startAppTrial(organizationId);

    markOnboarding();

    trackEvent(EVENTS.APP_TRIAL_STARTED, { from });

    await TokenStore.refresh()
      .then(() => TokenStore.getSpace(trialSpace?.sys.id as string))
      .then((space) => spaceContext.resetWithSpace(space));

    const environmentId = spaceContext.getEnvironmentId() as string;
    const spaceId = spaceContext.getId() as string;
    const cma = spaceContext.cma;

    await installApps(apps, organizationId, spaceId, environmentId, cma);

    if (!existingUsers) {
      await contentImport(spaceId, environmentId);
    }

    isSuccessful = true;
    Notification.success('Congratulations, we started your trial!');
    goToSpaceHome(spaceId);
  } catch (e) {
    if (e instanceof TrialSpaceServerError) {
      Notification.error('Use the ´Start free trial´ button above to try again.', {
        title: 'Oh sorry! We couldn’t start your trial.',
      });
      goToSubscriptionPage(organizationId);
    } else if (e instanceof AppInstallationError) {
      const title = `Oh sorry! We weren’t able to install ${
        e.message === 'all' ? 'Compose + Launch' : capitalizeFirst(e.message)
      }.`;
      const message = `Use the ´Start installation´ button above to install ${
        e.message === 'all' ? 'them' : 'it'
      } manually.`;
      Notification.error(message, { title });
      goToSpaceHome(spaceContext.getId() as string);
    } else if (e instanceof ContentImportError) {
      goToSpaceHome(spaceContext.getId() as string);
    } else {
      // other errors including TrialSpaceCreation violation and permission errors.
      captureError(e);
      goToSubscriptionPage(organizationId);
    }
  }

  clearCachedProductCatalogFlags();

  const stopTimeTracker = window.performance.now();
  const trialDuration = stopTimeTracker - startTimeTracker;

  trackEvent(EVENTS.APP_TRIAL_PERFORMANCE, {
    duration: trialDuration,
    withContentModel: !existingUsers,
    isSuccessful: isSuccessful,
  });
};

export function StartAppTrial({
  orgId,
  existingUsers = false,
  from: fromNavigationState,
}: StartAppTrialProps) {
  const [searchParams] = useSearchParams();
  const from = fromNavigationState || searchParams.get('referrer') || 'marketing';

  useEffect(() => {
    trialBootstrap(orgId, existingUsers, from);
  }, []);

  return (
    <div className={cx('home', styles.fullScreen)} data-testid="start-app-trial">
      <EmptyStateContainer className={styles.emptyContainer}>
        <StartAppTrialIllustration className={defaultSVGStyle} />
        <Typography>
          <Heading>Weʼre setting up your trial space to try out Compose + Launch.</Heading>
          <Heading>This might take up to 1 minute.</Heading>
        </Typography>
      </EmptyStateContainer>
    </div>
  );
}