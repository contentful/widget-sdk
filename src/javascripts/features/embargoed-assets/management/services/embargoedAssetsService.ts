import * as EndpointFactory from 'data/EndpointFactory';
import APIClient from 'data/APIClient';
import { Level } from '../constants';

export interface EmbargoedAsset {
  level: Level;
}

export interface EmbargoedAssetApi {
  protectionMode: Level | null;
}

function responseConverter(data: EmbargoedAssetApi): EmbargoedAsset {
  return { level: data.protectionMode || 'disabled' };
}

export function embargoedAssets(spaceId: string) {
  const endpoint = EndpointFactory.createSpaceEndpoint(spaceId, undefined);
  const apiClient = new APIClient(endpoint);

  return {
    async getCurrentLevel(): Promise<EmbargoedAsset> {
      const response = await apiClient.getEmbargoedAssetsSettingLevel();
      return responseConverter(response);
    },
    async setCurrentLevel(level: Level | 'enabled' | null): Promise<EmbargoedAsset> {
      if (level === 'disabled') {
        level = null;
      }
      if (level === 'enabled') {
        level = 'migrating';
      }
      const response = await apiClient.setEmbargoedAssetsSettingLevel(level);
      return responseConverter(response);
    },
  };
}
