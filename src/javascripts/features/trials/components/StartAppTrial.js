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
import { Heading, Typography, Notification } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import EmptyStateContainer, {
  defaultSVGStyle,
} from 'components/EmptyStateContainer/EmptyStateContainer';
import StartAppTrialIllustration from 'svg/illustrations/start-app-trial-illustration.svg';
import { getCMAClient } from 'core/services/usePlainCMAClient';

const styles = css({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
  width: '100%',
  div: {
    maxWidth: 'unset',
  },
  h1: {
    marginBottom: tokens.spacingXs,
  },
});

export function StartAppTrial({ orgId, existingUsers }) {
  const trialBootstrap = useCallback(async () => {
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
    <div data-testid="start-app-trial" className="home home-section">
      <EmptyStateContainer className={styles}>
        <StartAppTrialIllustration className={defaultSVGStyle} />
        <Typography>
          <Heading>Weʼre setting up your trial space to try out Compose + Launch</Heading>
          <Heading>This might take up to 1 minute</Heading>
        </Typography>
      </EmptyStateContainer>
    </div>
  );
}

StartAppTrial.propTypes = {
  orgId: PropTypes.string.isRequired,
  existingUsers: PropTypes.bool,
};
