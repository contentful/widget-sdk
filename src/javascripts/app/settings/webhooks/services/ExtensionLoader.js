import { getModule } from 'NgRegistry';
import { createExtensionLoader } from 'widgets/ExtensionLoader';
import { getAppDefinitionLoader } from './AppDefinitionLoaderInstance';

const perSpaceCache = {};

export function getExtensionLoader() {
  const spaceContext = getModule('spaceContext');
  const spaceId = spaceContext.getId();

  if (!perSpaceCache[spaceId]) {
    perSpaceCache[spaceId] = createExtensionLoader(getAppDefinitionLoader(), spaceContext.endpoint);
  }

  return perSpaceCache[spaceId];
}
