import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { isEnterprisePlan } from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { go } from 'states/Navigator';
import { FLAGS, getVariation } from 'LaunchDarkly';
import { createAppTrialRepo } from './AppTrialRepo';
import { getAppsRepo } from 'features/apps-core';
import { getModule } from 'core/NgRegistry';
import * as TokenStore from 'services/TokenStore';

const TRIALABLE_APPS = ['compose', 'launch'];

export const canStartAppTrial = async (organization, basePlan) => {
  const featureFlag = await getVariation(FLAGS.APP_TRIAL, {
    organizationId: organization.sys.id,
    spaceId: undefined,
    environmentId: undefined,
  });

  if (!featureFlag || !isOwnerOrAdmin(organization) || isEnterprisePlan(basePlan)) {
    return false;
  }
  const orgEndpoint = createOrganizationEndpoint(organization.sys.id);
  const feature = await createAppTrialRepo(orgEndpoint).getTrial('compose_app');
  return !feature.enabled && !feature.sys.trial;
};

const installApps = async () => {
  try {
    const apps = await Promise.all(TRIALABLE_APPS.map((name) => getAppsRepo().getApp(name)));
    // TODO: replace the next lines with an AppManager() instance
    // It has a out-of-box tracking and error handling
    const spaceContext = getModule('spaceContext');
    await Promise.allSettled(
      apps.map((app) =>
        spaceContext.cma.updateAppInstallation(app.appDefinition.sys.id, undefined, true)
      )
    );
  } catch (e) {
    console.log(e);
    throw new Error(`Failed to install Apps`);
  }
};

export const startAppTrial = async (orgId: string) => {
  const orgEndpoint = createOrganizationEndpoint(orgId);
  try {
    const trial = await createAppTrialRepo(orgEndpoint).createTrial();

    await TokenStore.refresh();

    await go({
      path: ['spaces', 'detail'],
      params: {
        spaceId: trial.spaceKey,
      },
    }).then(installApps);

    // TODO: bootstrap the space

    // TODO: remove the AppsListing redirection
    go({
      path: ['spaces', 'detail', 'apps', 'list'],
      params: {
        spaceId: trial.spaceKey,
      },
    });

    return trial;
  } catch (e) {
    console.log(e);
  }
};
