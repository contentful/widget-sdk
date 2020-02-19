/**
 * @typedef { import("contentful-ui-extensions-sdk").SpaceAPI } SpaceAPI
 */

import { waitUntilAssetProcessed } from 'widgets/bridges/makeExtensionSpaceMethodsHandlers';

/**
 * @param {{ spaceContext: Object }}
 * @return {SpaceAPI}
 */
export function createSpaceApi({ spaceContext }) {
  return {
    getEntries: (...args) => {
      return spaceContext.cma.getEntries(...args);
    },
    getAsset: (...args) => {
      return spaceContext.cma.getAsset(...args);
    },
    waitUntilAssetProcessed: (assetId, locale) => {
      return waitUntilAssetProcessed(spaceContext.cma, assetId, locale);
    },
    processAsset: (...args) => {
      return spaceContext.cma.processAsset(...args);
    }
  };
}
