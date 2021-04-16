import { Level } from './constants';

export interface EmbargoedAsset {
  level: Level;
}

export interface EmbargoedAssetApi {
  protectionMode: Level | null;
}
