import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { isEnterprisePlan } from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { go } from 'states/Navigator';
import { FLAGS, getVariation } from 'LaunchDarkly';
import { createAppTrialRepo } from './AppTrialRepo';
import * as TokenStore from 'services/TokenStore';

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

export const startAppTrial = async (orgId: string, installAppsFn: Function) => {
  const orgEndpoint = createOrganizationEndpoint(orgId);
  try {
    const trial = await createAppTrialRepo(orgEndpoint).createTrial();

    await TokenStore.refresh();

    await go({
      path: ['spaces', 'detail'],
      params: {
        spaceId: trial.spaceKey,
      },
    });

    await installAppsFn(['compose', 'launch']);

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
