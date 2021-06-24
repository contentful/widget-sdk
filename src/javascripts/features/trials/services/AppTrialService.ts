import type { PlainClientAPI } from 'contentful-management';
import LocaleStore from 'services/localeStore';
import importer from '../utils/importer';
import { ContentImportError, TrialSpaceServerError } from '../utils/AppTrialError';
import { getCMAClient } from 'core/services/usePlainCMAClient';
import { FLAGS, getVariation } from 'core/feature-flags';

const FEATURE_TO_APP_NAME = {
  compose_app: 'compose',
  launch_app: 'launch',
};

export const startAppTrial = async (organizationId: string) => {
  try {
    const isTrialDecoupled = await getVariation(FLAGS.DECOUPLED_TRIAL, { organizationId });

    const trialsClient = getCMAClient({ organizationId }).internal.trials;
    const appsTrial = await trialsClient.create({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      productId: isTrialDecoupled ? 'add_on.compose_launch' : 'add_on_compose_launch',
    });
    const {
      sys: { space },
    } = await trialsClient.create({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      productId: isTrialDecoupled ? 'space.medium' : 'space_size_3',
      parentId: appsTrial.sys.id,
      spaceName: 'Contentful Apps',
    });

    return {
      apps: appsTrial.sys.features?.map((feature) => FEATURE_TO_APP_NAME[feature]),
      trialSpace: space,
    };
  } catch (e) {
    const { status } = JSON.parse(e.message);

    if (status !== 422 && status !== 403) {
      throw new TrialSpaceServerError();
    }
    throw e;
  }
};

export const contentImport = async (spaceId: string, environmentId: string) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { internal, ...client } = getCMAClient({ spaceId, environmentId });
  const defaultLocaleCode = LocaleStore.getDefaultLocale().code;
  const { provisionHelpCenter } = await importer();
  try {
    await provisionHelpCenter(client as PlainClientAPI, defaultLocaleCode);
  } catch (e) {
    throw new ContentImportError();
  }
};
