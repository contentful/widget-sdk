import * as EndpointFactory from 'data/EndpointFactory';
import APIClient from 'data/APIClient';
import { LEVEL } from '../constants';

export interface EmbargoedAsset {
  level: LEVEL;
}

export function embargoedAssets(spaceId: string | undefined) {
  const endpoint = EndpointFactory.createSpaceEndpoint(spaceId, undefined);
  const apiClient = new APIClient(endpoint);

  return {
    getCurrentLevel() {
      return apiClient.getEmbargoedAssetsSettingLevel() as Promise<EmbargoedAsset>;
    },
    setCurrentLevel(level: LEVEL | 'enabled') {
      return apiClient.setEmbargoedAssetsSettingLevel(level) as Promise<EmbargoedAsset>;
    },
  };
}
