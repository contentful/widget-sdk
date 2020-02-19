/**
 * @typedef { import("contentful-ui-extensions-sdk").SpaceAPI } SpaceAPI
 */

import { getBatchingApiClient } from '../WidgetApi/BatchingApiClient';
import { waitUntilAssetProcessed } from 'widgets/bridges/makeExtensionSpaceMethodsHandlers';

/**
 * @param {{ spaceContext: Object }}
 * @return {SpaceAPI}
 */
export function createSpaceApi({ spaceContext }) {
  const optimizedApiClient = getBatchingApiClient(spaceContext.cma);

  const {
    getAsset,
    getAssets,
    getEntry,
    getEntries,
    getContentType,
    getContentTypes
  } = optimizedApiClient;

  return {
    getEntries,
    getAsset,
    getAssets,
    getEntry,
    getContentType,
    getContentTypes,
    waitUntilAssetProcessed: (assetId, locale) => {
      return waitUntilAssetProcessed(spaceContext.cma, assetId, locale);
    },
    processAsset: (...args) => {
      return spaceContext.cma.processAsset(...args);
    }
  };
}
