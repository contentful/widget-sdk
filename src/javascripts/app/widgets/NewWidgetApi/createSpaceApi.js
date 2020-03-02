/**
 * @typedef { import("contentful-ui-extensions-sdk").SpaceAPI } SpaceAPI
 */

import * as PublicContentType from 'widgets/PublicContentType';
import { waitUntilAssetProcessed } from 'widgets/bridges/makeExtensionSpaceMethodsHandlers';

/**
 * @param {APIClient} cma
 * @return {SpaceAPI}
 */
export function createSpaceApi({ cma, initialContentTypes }) {
  const {
    getAsset,
    getAssets,
    getEntry,
    getEntries,
    getContentType,
    getContentTypes,
    createEntry,
    createAsset
  } = cma;

  return {
    getCachedContentTypes: () => {
      return initialContentTypes.map(contentType => PublicContentType.fromInternal(contentType));
    },
    getEntries,
    getAsset,
    getAssets,
    getEntry,
    getContentType,
    getContentTypes,
    createEntry,
    createAsset,
    waitUntilAssetProcessed: (assetId, locale) => {
      return waitUntilAssetProcessed(cma, assetId, locale);
    },
    processAsset: (...args) => {
      return cma.processAsset(...args);
    }
  };
}
