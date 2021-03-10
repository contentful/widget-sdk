import React, { useCallback } from 'react';
import { css, cx } from 'emotion';
import PropTypes from 'prop-types';
import { useAsync } from 'core/hooks';
import { FLAGS, getVariation } from 'LaunchDarkly';
import { spaceSetUp, startAppTrial } from '../services/AppTrialService';
import { getAppsRepo } from 'features/apps-core';
import { AppManager } from 'features/apps';
import { getModule } from 'core/NgRegistry';
import * as TokenStore from 'services/TokenStore';
import { clearCachedProductCatalogFlags } from 'data/CMA/ProductCatalog';
import { go } from 'states/Navigator';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';
import { Heading, Typography, Notification } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import * as logger from 'services/logger';
import EmptyStateContainer, {
  defaultSVGStyle,
} from 'components/EmptyStateContainer/EmptyStateContainer';
import StartAppTrialIllustration from 'svg/illustrations/start-app-trial-illustration.svg';
import { getCMAClient } from 'core/services/usePlainCMAClient';
import { getSpaceAutoCreatedKey } from 'components/shared/auto_create_new_space/getSpaceAutoCreatedKey';
import { getBrowserStorage } from 'core/services/BrowserStorage';

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

export function StartAppTrial({ orgId, existingUsers }) {
  const trialBootstrap = useCallback(async () => {
    const store = getBrowserStorage();
    const startTimeTracker = window.performance.now();

    let isSuccessful = false;

    try {
      const appTrialFeatureEnabled = await getVariation(FLAGS.APP_TRIAL, {
        organizationId: orgId,
      });

      if (!appTrialFeatureEnabled) {
        throw new Error('The feature is not available just yet');
      }

      const { trial, apps } = await startAppTrial(orgId);

      const user = await TokenStore.getUser();
      store.set(getSpaceAutoCreatedKey(user, 'success'), true);

      const spaceContext = getModule('spaceContext');
      await TokenStore.refresh()
        .then(() => TokenStore.getSpace(trial.spaceKey))
        .then((space) => spaceContext.resetWithSpace(space));

      const appRepos = await Promise.all(apps.map(getAppsRepo().getAppByIdOrSlug));

      const environmentId = spaceContext.getEnvironmentId();
      const spaceId = spaceContext.getId();

      const appsManager = new AppManager(spaceContext.cma, environmentId, spaceId, orgId);

      await Promise.all(appRepos.map((app) => appsManager.installApp(app, true, false)));

      if (!existingUsers) {
        await spaceSetUp(getCMAClient({ spaceId, environmentId }));
      }

      isSuccessful = true;
      Notification.success('Congratulations, we started your trial!');
      go({
        path: ['spaces', 'detail'],
        params: {
          spaceId: trial.spaceKey,
        },
        options: { location: 'replace' },
      });
    } catch (exception) {
      Notification.error('Oh snap! Something went wrong!');
      // logger.logException(exception, {
      //   groupingHash: 'Failed during App Trial creation',
      // });
      logger.logError('AppTrialError', { error: exception });
      go({
        path: ['account', 'organizations', 'subscription_new'],
        params: {
          orgId,
        },
        options: { location: 'replace' },
      });
    }

    clearCachedProductCatalogFlags();

    const stopTimeTracker = window.performance.now();
    const trialDuration = stopTimeTracker - startTimeTracker;

    trackEvent(EVENTS.APP_TRIAL_PERFORMANCE, {
      duration: trialDuration,
      withContentModel: !existingUsers,
      isSuccessful: isSuccessful,
    })();
  }, [orgId, existingUsers]);

  useAsync(trialBootstrap);

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

StartAppTrial.propTypes = {
  orgId: PropTypes.string.isRequired,
  existingUsers: PropTypes.bool,
};
