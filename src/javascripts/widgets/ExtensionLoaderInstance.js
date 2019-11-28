import { getModule } from 'NgRegistry';
import { get, set } from 'lodash';
import { createExtensionLoader } from './ExtensionLoader';
import { getAppsRepo } from 'app/settings/AppsBeta/AppsRepoInstance';

// Extension is an environment-level entity:
// we cache loaders per space-environment.
const perSpaceEnvCache = {};

export function getExtensionLoader() {
  const spaceContext = getModule('spaceContext');
  const spaceId = spaceContext.getId();
  const environmentId = spaceContext.getEnvironmentId();

  let loader = get(perSpaceEnvCache, [spaceId, environmentId]);

  if (!loader) {
    loader = createExtensionLoader(spaceContext.cma, getAppsRepo());
    set(perSpaceEnvCache, [spaceId, environmentId], loader);
  }

  return loader;
}
