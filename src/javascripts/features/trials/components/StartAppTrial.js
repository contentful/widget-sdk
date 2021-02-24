import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAsync } from 'core/hooks';
import { FLAGS, getVariation } from 'LaunchDarkly';
import { startAppTrial } from 'features/trials';
import { getAppsRepo } from 'features/apps-core';
import { AppManager } from 'features/apps';
import { getModule } from 'core/NgRegistry';
import * as TokenStore from 'services/TokenStore';
import { clearCachedProductCatalogFlags } from 'data/CMA/ProductCatalog';
import { go } from 'states/Navigator';
import {
  Heading,
  Typography,
  Paragraph,
  Notification,
} from '@contentful/forma-36-react-components';
import EmptyStateContainer, {
  defaultSVGStyle,
} from 'components/EmptyStateContainer/EmptyStateContainer';
import StartAppTrialIllustration from 'svg/illustrations/start-app-trial-illustration.svg';

export function StartAppTrial({ orgId }) {
  const trialBootstrap = useCallback(async () => {
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

      const appsManager = new AppManager(
        spaceContext.cma,
        spaceContext.getEnvironmentId(),
        spaceContext.getId(),
        orgId
      );

      await Promise.all(appRepos.map((app) => appsManager.installApp(app, true)));

      clearCachedProductCatalogFlags();

      go({
        path: ['spaces', 'detail'],
        params: {
          spaceId: trial.spaceKey,
        },
        options: { location: 'replace' },
      });
    } catch (exception) {
      Notification.error('Contentful Apps trial could not be started!');
      go({
        path: ['account', 'organizations', 'subscription_new'],
        params: {
          orgId,
        },
        options: { location: 'replace' },
      });
    }
  }, [orgId]);

  useAsync(trialBootstrap);

  return (
    <div data-testid="start-app-trial" className="home home-section">
      <EmptyStateContainer>
        <StartAppTrialIllustration className={defaultSVGStyle} />
        <Typography>
          <Heading>Putting the cherry on top...</Heading>
          <Paragraph>Weʼre setting up your trial space to try out Compose + Launch</Paragraph>
        </Typography>
      </EmptyStateContainer>
    </div>
  );
}

StartAppTrial.propTypes = {
  orgId: PropTypes.string.isRequired,
};
