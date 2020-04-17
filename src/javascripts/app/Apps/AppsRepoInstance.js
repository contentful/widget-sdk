import { getModule } from 'core/NgRegistry';
import { get, set } from 'lodash';
import createAppsRepo from 'app/Apps/AppsRepo';
import { getAppDefinitionLoader } from 'app/Apps/AppDefinitionLoaderInstance';

// AppInstallation is an environment-scoped entity:
// we cache loaders per space-environment.
const perSpaceEnvCache = {};

export function getAppsRepo() {
  const spaceContext = getModule('spaceContext');
  const spaceId = spaceContext.getId();
  const environmentId = spaceContext.getEnvironmentId();

  let repo = get(perSpaceEnvCache, [spaceId, environmentId]);

  if (!repo) {
    repo = createAppsRepo(spaceContext.cma, getAppDefinitionLoader());
    set(perSpaceEnvCache, [spaceId, environmentId], repo);
  }

  return repo;
}
