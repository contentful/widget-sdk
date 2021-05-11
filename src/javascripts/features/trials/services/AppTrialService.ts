import type { PlainClientAPI } from 'contentful-management';
import LocaleStore from 'services/localeStore';
import importer from '../utils/importer';
import { ContentImportError, TrialSpaceServerError } from '../utils/AppTrialError';
import { getCMAClient } from 'core/services/usePlainCMAClient';

const FEATURE_TO_APP_NAME = {
  compose_app: 'compose',
  launch_app: 'launch',
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
    const { status } = e;

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
