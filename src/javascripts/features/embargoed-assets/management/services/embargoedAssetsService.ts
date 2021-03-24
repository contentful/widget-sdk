import * as EndpointFactory from 'data/EndpointFactory';
import APIClient from 'data/APIClient';
import { LEVEL } from '../constants';

export interface EmbargoedAsset {
  level: LEVEL;
}

export interface EmbargoedAssetApi {
  protectionMode: LEVEL | null;
}

function responseConverter(data: EmbargoedAssetApi): EmbargoedAsset {
  return { level: data.protectionMode || LEVEL.DISABLED };
}

export function embargoedAssets(spaceId: string | undefined) {
  const endpoint = EndpointFactory.createSpaceEndpoint(spaceId, undefined);
  const apiClient = new APIClient(endpoint);

  return {
    async getCurrentLevel(): Promise<EmbargoedAsset> {
      const response = await apiClient.getEmbargoedAssetsSettingLevel();
      return responseConverter(response);
    },
    async setCurrentLevel(level: LEVEL | 'enabled' | null): Promise<EmbargoedAsset> {
      if (level === LEVEL.DISABLED) {
        level = null;
      }
      const response = await apiClient.setEmbargoedAssetsSettingLevel(level);
      return responseConverter(response);
    },
  };
}
