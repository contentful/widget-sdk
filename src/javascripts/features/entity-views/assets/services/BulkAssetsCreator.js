import { identity, isString } from 'lodash';
import { FilestackService } from '@contentful/field-editor-file';
import * as Config from 'Config';
import { Notification } from '@contentful/forma-36-react-components';
import * as stringUtils from 'utils/StringUtils';
import * as logger from 'services/logger';
import { getModule } from 'core/NgRegistry';
import { getCMAClient } from 'core/services/usePlainCMAClient';

/**
 * @typedef { import("contentful-management").PlainClientAPI }  PlainClientAPI
 */

/**
 * Opens file selector to select files which will then be uploaded as assets.
 * The resolved assets will still be in processing once `open()` resolves. Any
 * remote action triggered on these instances will fail as they are invalid
 * as long as processing is not done and once it is done the version will be
 * outdated.
 *
 * @param {string} localeCode Internal locale code files will be uploaded for.
 * @returns {Promise<Array<Asset>>}
 */
export function open(localeCode) {
  if (!isString(localeCode)) {
    throw new TypeError('locale must be a string');
  }

  const spaceContext = getModule('spaceContext');

  const cma = getCMAClient({
    spaceId: spaceContext.getId(),
    environmentId: spaceContext.getEnvironmentId(),
  });

  const { apiKey, policy, signature } = Config.services.filestack;

  return FilestackService.pickMultiple({
    config: {
      apiKey,
      policy,
      signature,
    },
  }).then(createAssetsForFiles, () => {
    Notification.error(
      'An error occurred while uploading multiple assets. ' +
        'Please contact support if this problem persists.'
    );

    return [];
  });

  function createAssetsForFiles(files) {
    if (files.length === 0) {
      return Promise.resolve([]);
    }
    return Promise.all(files.map(createAssetForFile)).then(
      (assets) => {
        assets = assets.filter(identity);
        Notification.success('Assets uploaded. Processing…');
        return Promise.all(assets.map(processAssetForFile))
          .then(() => {
            Notification.success('Assets processed. Updating…');
            return assets;
          })
          .catch((error) => {
            Notification.error('Some assets failed to process');
            return Promise.reject(error);
          });
      },
      (error) => {
        logger.captureWarning(error);
        Notification.error('Some assets failed to upload');

        return Promise.reject(error);
      }
    );
  }

  function createAssetForFile(file) {
    const title = stringUtils.fileNameToTitle(file.fileName);
    return cma.asset.create(
      {},
      {
        fields: {
          file: {
            [localeCode]: file,
          },
          title: { [localeCode]: title },
        },
      }
    );
  }

  function processAssetForFile(asset) {
    return cma.asset.processForLocale({}, asset, localeCode);
  }
}
