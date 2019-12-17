import { open, tryToPublishProcessingAssets } from './BulkAssetsCreator';
import { Notification } from '@contentful/forma-36-react-components';
import TheLocaleStore from 'services/localeStore';

const getDefaultLocaleCode = () => TheLocaleStore.getDefaultLocale().code;

export async function openBulkAssetsCreatorAndProcess(localeCode = getDefaultLocaleCode()) {
  const assetObjects = await open(localeCode);
  const result = await tryToPublishProcessingAssets(assetObjects);
  const { publishedAssets, unpublishableAssets } = result;
  if (publishedAssets.length && !unpublishableAssets.length) {
    Notification.success(
      (publishedAssets.length === 1
        ? 'The asset was'
        : `All ${publishedAssets.length} assets were`) + ' just published'
    );
  } else if (unpublishableAssets.length) {
    Notification.error(
      `Failed to publish ${
        unpublishableAssets.length === 1 ? 'the asset' : `${unpublishableAssets.length} assets`
      }`
    );
  }

  return {
    publishedAssets: publishedAssets.map(({ data }) => data),
    unpublishableAssets: unpublishableAssets.map(({ data }) => data)
  };
}
