import { AssetConfiguration, EntryConfiguration } from '../SidebarDefaults.es6';

export const getAssetConfiguration = () => {
  return Promise.resolve(AssetConfiguration);
};

export const getEntryConfiguration = async () => {
  return Promise.resolve(EntryConfiguration);
};
