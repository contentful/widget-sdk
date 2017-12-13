import {identity} from 'lodash';
import $q from '$q';
import * as Filepicker from 'services/Filepicker';
import logger from 'logger';
import notification from 'notification';
import stringUtils from 'stringUtils';
import spaceContext from 'spaceContext';
import TheLocaleStore from 'TheLocaleStore';

/**
 * Opens filepicker to select media files which will then be uploaded as assets.
 * The resolved assets will still be in processing once `open()` resolves. Any
 * remote action triggered on these instances will fail as they are invalid
 * as long as processing is not done and once it is done the version will be
 * outdated.
 *
 * @returns {Promise<Array<Asset>>}
 */
export function open () {
  return Filepicker.pickMultiple().then(uploadFPFiles, (fpError) => {
    if (!Filepicker.isUserClosedDialogError(fpError)) {
      notification.error(
        'An error occurred while uploading multiple assets. ' +
        'Please contact support if this problem persists.'
      );
    }
    return [];
  });
}

function uploadFPFiles (fpFiles) {
  return $q.all(fpFiles.map(createAssetForFile)).then((assets) => {
    assets = assets.filter(identity);
    notification.info('Assets uploaded. Processing…');
    return $q.all(assets.map(processAssetForFile)).then(() => {
      notification.info('Assets processed. Updating…');
      return assets;
    }).catch((error) => {
      notification.warn('Some assets failed to process');
      return $q.reject(error);
    });
  }, (error) => {
    logger.logServerWarn('Some assets failed to upload', { error });
    notification.error('Some assets failed to upload');
    return $q.reject(error);
  });
}

function createAssetForFile (fpFile) {
  const file = Filepicker.parseFPFile(fpFile);
  const locale = TheLocaleStore.getDefaultLocale().internal_code;
  const data = {
    sys: { type: 'Asset' },
    fields: { file: {}, title: {} }
  };
  data.fields.file[locale] = file;
  data.fields.title[locale] = stringUtils.fileNameToTitle(file.fileName);

  return spaceContext.space.createAsset(data);
}

function processAssetForFile (asset) {
  const locale = TheLocaleStore.getDefaultLocale().internal_code;
  return asset.process(asset.version, locale);
}
