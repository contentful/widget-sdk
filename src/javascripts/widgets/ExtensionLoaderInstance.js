import { getModule } from 'NgRegistry';
import { createExtensionLoader } from './ExtensionLoader';
import { getAppDefinitionLoader } from 'app/settings/AppsBeta/AppDefinitionLoaderInstance';

const perSpaceCache = {};

export function getExtensionLoader() {
  const spaceContext = getModule('spaceContext');
  const spaceId = spaceContext.getId();

  if (!perSpaceCache[spaceId]) {
    perSpaceCache[spaceId] = createExtensionLoader(getAppDefinitionLoader(), spaceContext.endpoint);
  }

  return perSpaceCache[spaceId];
}
