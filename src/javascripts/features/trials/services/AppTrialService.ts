import moment from 'moment';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { isEnterprisePlan } from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { go } from 'states/Navigator';
import { FLAGS, getVariation } from 'LaunchDarkly';
import { AppTrialFeature, createAppTrialRepo } from './AppTrialRepo';
import * as TokenStore from 'services/TokenStore';
import { isTrialSpaceType } from './TrialService';

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

export const isActiveAppTrial = (feature: AppTrialFeature) => {
  if (!feature || !feature.sys.trial || !feature.enabled) {
    return false;
  }

  return moment().isSameOrBefore(moment(feature.sys.trial.endsAt), 'date');
};

export const isExpiredAppTrial = (feature: AppTrialFeature) => {
  if (!feature || !feature.sys.trial || feature.enabled) {
    return false;
  }

  return moment().isAfter(moment(feature.sys.trial.endsAt), 'date');
};

export const getAppTrialSpaceKey = async (feature: AppTrialFeature): Promise<string | null> => {
  if (!feature || !feature.sys.trial) {
    return null;
  }

  const appTrialSpace = await TokenStore.getSpaces().then((accessibleSpaces) =>
    accessibleSpaces.find(
      (space) =>
        space.organization.sys.id === feature.sys.organization.sys.id && isTrialSpaceType(space)
    )
  );

  if (!appTrialSpace) {
    // the App Trial Space was deleted or is not accessible to the user
    return null;
  }

  return appTrialSpace.sys.id;
};
