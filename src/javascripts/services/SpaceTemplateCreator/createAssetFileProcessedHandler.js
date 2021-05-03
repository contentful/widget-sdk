/**
 * createAssetFileProcessedHandler() was originally part of the EntityRepo
 * module in the user_interface repo.
 *
 * Now we are using EntityRepo from @contentful/editorial-primitives which
 * uses a plain cma client, not a space endpoint, and doesn't export a
 * createAssetFileProcessedHandler() function
 */

import { ASSET_PROCESSING_FINISHED_EVENT } from 'services/PubSubService';

//TODO: use logic from '@contentful/experience-packages, which is based on the plain cma client
export function createAssetFileProcessedHandler(spaceEndpoint, pubSubClient) {
  return function onAssetFileProcessed(entitySys, callback) {
    const handler = (msg) => {
      const envId = spaceEndpoint.envId || 'master';
      if (
        entitySys.type === 'Asset' &&
        msg.assetId === entitySys.id &&
        msg.environmentId === envId
      ) {
        callback();
      }
    };
    pubSubClient.on(ASSET_PROCESSING_FINISHED_EVENT, handler);
    return () => pubSubClient.off(ASSET_PROCESSING_FINISHED_EVENT, handler);
  };
}
