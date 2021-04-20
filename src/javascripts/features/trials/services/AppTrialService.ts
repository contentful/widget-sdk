import moment from 'moment';
import { isTrialSpaceType } from './TrialService';
import * as TokenStore from 'services/TokenStore';
import TheLocaleStore from 'services/localeStore';
import importer from '../utils/importer';
import type { PlainClientAPI } from 'contentful-management';
import { AppTrialFeature } from '../types/AppTrial';
import * as logger from 'services/logger';
import { ContentImportError, TrialSpaceServerError } from '../utils/AppTrialError';
import { getCMAClient } from 'core/services/usePlainCMAClient';

const FEATURE_TO_APP_NAME = {
  compose_app: 'compose', // eslint-disable-line @typescript-eslint/camelcase
  launch_app: 'launch', // eslint-disable-line @typescript-eslint/camelcase
};

export const startAppTrial = async (organizationId: string) => {
  try {
    const trialsClient = getCMAClient({ organizationId }).internal.trials;
    const appsTrial = await trialsClient.create({ productId: 'add_on_compose_launch' });
    const {
      sys: { space },
    } = await trialsClient.create({
      productId: 'space_size_3',
      parentId: appsTrial.sys.id,
      spaceName: 'Contentful Apps',
    });

    return {
      apps: appsTrial.sys.features?.map((feature) => FEATURE_TO_APP_NAME[feature]),
      trialSpace: space,
    };
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { internal, ...client } = getCMAClient({ spaceId, environmentId });
  const defaultLocaleCode = TheLocaleStore.getDefaultLocale().code;
  const { provisionHelpCenter } = await importer();
  try {
    await provisionHelpCenter(client as PlainClientAPI, defaultLocaleCode);
  } catch (e) {
    logger.captureError(new Error('Content import failed during apps trial'), {
      originalError: e,
    });
    throw new ContentImportError();
  }
};
