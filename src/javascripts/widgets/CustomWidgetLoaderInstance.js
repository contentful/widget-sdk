import { getModule } from 'NgRegistry';
import { get, set } from 'lodash';
import { createCustomWidgetLoader } from './CustomWidgetLoader';
import { getAppsRepo } from 'app/Apps/AppsRepoInstance';

// Both Extension and AppInstallation are environment-level
// entities: we cache loaders per space-environment.
const perSpaceEnvCache = {};

export function getCustomWidgetLoader() {
  const spaceContext = getModule('spaceContext');
  const spaceId = spaceContext.getId();
  const environmentId = spaceContext.getEnvironmentId();

  let loader = get(perSpaceEnvCache, [spaceId, environmentId]);

  if (!loader) {
    loader = createCustomWidgetLoader(spaceContext.cma, getAppsRepo());
    set(perSpaceEnvCache, [spaceId, environmentId], loader);
  }

  return loader;
}
