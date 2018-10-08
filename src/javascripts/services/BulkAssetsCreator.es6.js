import { identity, isString } from 'lodash';
import $q from '$q';
import $timeout from '$timeout';
import * as Filestack from 'services/Filestack.es6';
import logger from 'logger';
import notification from 'notification';
import * as stringUtils from 'utils/StringUtils.es6';
import spaceContext from 'spaceContext';

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

  return Filestack.pickMultiple().then(createAssetsForFiles, () => {
    notification.error(
      'An error occurred while uploading multiple assets. ' +
        'Please contact support if this problem persists.'
    );

    return [];
  });

  function createAssetsForFiles(files) {
    if (files.length === 0) {
      return $q.resolve([]);
    }
    return $q.all(files.map(createAssetForFile)).then(
      assets => {
        assets = assets.filter(identity);
        notification.info('Assets uploaded. Processing…');
        return $q
          .all(assets.map(processAssetForFile))
          .then(() => {
            notification.info('Assets processed. Updating…');
            return assets;
          })
          .catch(error => {
            notification.warn('Some assets failed to process');
            return $q.reject(error);
          });
      },
      error => {
        logger.logServerWarn('Some assets failed to upload', { error });
        notification.error('Some assets failed to upload');
        return $q.reject(error);
      }
    );
  }

  function createAssetForFile(file) {
    const title = stringUtils.fileNameToTitle(file.fileName);
    const data = {
      sys: { type: 'Asset' },
      fields: {
        file: { [localeCode]: file },
        title: { [localeCode]: title }
      }
    };
    return spaceContext.space.createAsset(data);
  }

  function processAssetForFile(asset) {
    return asset.process(asset.version, localeCode);
  }
}

/**
 * Takes newly created assets that are still processing and tries to publish them.
 * The assumption is that processing just takes a few seconds, so once processing is
 * done, the processed asset is available in the CMA and can therefore be published.
 * Since we can not know for sure how long processing takes and whether it succeeds
 * we try multiple times. We wait two seconds before the first try and one second
 * for each subsequent try. Tries for a maximum of six seconds.
 *
 * @param {Array<Asset>}assets
 * @returns {Promise<Object{publishedAssets, unpublishableAssets}>}
 */
export function tryToPublishProcessingAssets(assets) {
  const publishedAssets = [];
  const unpublishableAssets = [];

  if (!assets.length) {
    return $q.resolve({ publishedAssets, unpublishableAssets });
  }

  let triesLeft = 5;

  return $timeout(1000)
    .then(() => {
      return nextTry(assets, triesLeft);
    })
    .then(() => ({
      publishedAssets: publishedAssets.slice(),
      unpublishableAssets: unpublishableAssets.slice()
    }));

  function nextTry(assets) {
    if (assets.length) {
      return $timeout(1000).then(() => {
        triesLeft = triesLeft - 1;
        return tryLast(assets);
      });
    }
  }

  // Assume last given asset's processing started last and will be done last.
  // Once the last given asset can be published, try to publish all other assets.
  function tryLast(assets) {
    if (triesLeft > 0) {
      const lastAsset = assets[assets.length - 1];
      const otherAssets = assets.slice(0, -1);
      return tryToPublish(lastAsset)
        .then(() => tryAll(otherAssets).catch(unprocessedAssets => nextTry(unprocessedAssets)))
        .catch(() => nextTry(assets));
    } else {
      return tryAll(assets).catch(() => $q.resolve());
    }
  }

  function tryAll(assets) {
    const rejectedAssets = [];
    return $q
      .all(
        assets.map(asset => {
          return tryToPublish(asset).catch(() => rejectedAssets.push(asset));
        })
      )
      .then(() => {
        if (rejectedAssets.length) {
          return $q.reject(rejectedAssets); // Try again!
        }
      });
  }

  function tryToPublish(asset) {
    return publishUnprocessedAsset(asset).then(
      () => publishedAssets.push(asset),
      error => {
        if (triesLeft && error.status === 409) {
          return $q.reject(asset); // Try again!
        } else {
          unpublishableAssets.push(asset);
        }
      }
    );
  }
}

function publishUnprocessedAsset(asset) {
  // After processing, a new asset's version will be `2`.
  // If processing is not done then the remote asset's version
  // is still `1` and we get a version mismatch.
  asset.setVersion(2);
  const publish = asset.publish();
  asset.setVersion(1);
  return publish;
}
