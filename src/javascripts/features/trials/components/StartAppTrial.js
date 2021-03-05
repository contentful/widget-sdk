import React, { useCallback } from 'react';
import { css } from 'emotion';
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
import { Heading, Typography, Notification, Flex } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
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
    background: "url('/assets/practitioner-home-bg.png') no-repeat",
    backgroundColor: tokens.colorWhite,
    backgroundSize: 'cover',
    zIndex: tokens.zIndexModal,
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
  }),
};

export function StartAppTrial({ orgId, existingUsers }) {
  const trialBootstrap = useCallback(async () => {
    const store = getBrowserStorage();
    const startTimeTracker = window.performance.now();

    let isBootstrapped = false;
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
        isBootstrapped = true;
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
      isBootstrapped: isBootstrapped,
      isSuccessful: isSuccessful,
    })();
  }, [orgId, existingUsers]);

  useAsync(trialBootstrap);

  return (
    <Flex className={styles.fullScreen} data-testid="start-app-trial">
      <EmptyStateContainer className={styles.emptyContainer}>
        <StartAppTrialIllustration className={defaultSVGStyle} />
        <Typography>
          <Heading>Weʼre setting up your trial space to try out Compose + Launch.</Heading>
          <Heading>This might take up to 1 minute.</Heading>
        </Typography>
      </EmptyStateContainer>
    </Flex>
  );
}

StartAppTrial.propTypes = {
  orgId: PropTypes.string.isRequired,
  existingUsers: PropTypes.bool,
};
