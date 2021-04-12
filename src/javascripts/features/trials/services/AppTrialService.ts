import moment from 'moment';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { isEnterprisePlan } from 'account/pricing/PricingDataProvider';
import { getBasePlan } from 'features/pricing-entities';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import * as Repo from './AppTrialRepo';
import { isTrialSpaceType } from './TrialService';
import * as TokenStore from 'services/TokenStore';
import TheLocaleStore from 'services/localeStore';
import importer from '../utils/importer';
import type { PlainClientAPI } from 'contentful-management';
import { AppTrialFeature } from '../types/AppTrial';
import * as logger from 'services/logger';
import { ContentImportError, TrialSpaceServerError } from '../utils/AppTrialError';
import { getCMAClient } from 'core/services/usePlainCMAClient';

export const canStartAppTrial = async (organizationId: string) => {
  if (!isOwnerOrAdmin({ sys: { id: organizationId } })) {
    return false;
  }

  const orgEndpoint = createOrganizationEndpoint(organizationId);
  const [basePlan, productFeature] = await Promise.all([
    getBasePlan(orgEndpoint),
    Repo.getTrial(organizationId),
  ]);

  if (isEnterprisePlan(basePlan)) {
    return false;
  }

  return !productFeature.enabled && !productFeature.sys.trial;
};

export const startAppTrial = async (organizationId: string) => {
  try {
    const trial = await Repo.createTrial(organizationId);

    return { apps: ['compose', 'launch'], trial };
  } catch (e) {
    if (e.status >= 500) {
      logger.captureError(new Error('Could not create apps trial space'), {
        originalError: e,
      });

      throw new TrialSpaceServerError();
    }
    throw e;
  }
};

export const isActiveAppTrial = (feature?: AppTrialFeature) => {
  if (!feature || !feature.sys.trial || !feature.enabled) {
    return false;
  }

  return moment().isSameOrBefore(moment(feature.sys.trial.endsAt), 'date');
};

export const isExpiredAppTrial = (feature?: AppTrialFeature) => {
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

export const contentImport = async (spaceId: string, environmentId: string) => {
  const client = getCMAClient({ spaceId, environmentId }) as PlainClientAPI;
  const defaultLocaleCode = TheLocaleStore.getDefaultLocale().code;
  const { provisionHelpCenter } = await importer();
  try {
    await provisionHelpCenter(client, defaultLocaleCode);
  } catch (e) {
    logger.captureError(new Error('Content import failed during apps trial'), {
      originalError: e,
    });
    throw new ContentImportError();
  }
};
