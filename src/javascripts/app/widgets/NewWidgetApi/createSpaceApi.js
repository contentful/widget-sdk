/**
 * @typedef { import("contentful-ui-extensions-sdk").SpaceAPI } SpaceAPI
 */

import { waitUntilAssetProcessed } from 'widgets/bridges/makeExtensionSpaceMethodsHandlers';

/**
 * @param {APIClient} cma
 * @return {SpaceAPI}
 */
export function createSpaceApi({ cma }) {
  const { getAsset, getAssets, getEntry, getEntries, getContentType, getContentTypes, createEntry, createAsset } = cma;

  return {
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
