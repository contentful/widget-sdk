import { AssetConfiguration, EntryConfiguration } from '../defaults.es6';

export const getAssetConfiguration = () => {
  return Promise.resolve(AssetConfiguration);
};

export const getEntryConfiguration = async () => {
  return Promise.resolve(EntryConfiguration);
};
