import { getModule } from 'NgRegistry';
import { get, set } from 'lodash';
import { createExtensionLoader } from './ExtensionLoader';
import { getAppDefinitionLoader } from 'app/settings/AppsBeta/AppDefinitionLoaderInstance';

const perSpaceEnvCache = {};

export function getExtensionLoader() {
  const spaceContext = getModule('spaceContext');
  const spaceId = spaceContext.getId();
  const environmentId = spaceContext.getEnvironmentId();

  let loader = get(perSpaceEnvCache, [spaceId, environmentId]);

  if (!loader) {
    loader = createExtensionLoader(getAppDefinitionLoader(), spaceContext.endpoint);
    set(perSpaceEnvCache, [spaceId, environmentId], loader);
  }

  return loader;
}
