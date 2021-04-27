import { getSpaceContext } from 'classes/spaceContext';
import { get, set } from 'lodash';
import { AppsRepo } from './AppsRepo';
import { getAppDefinitionLoader } from './AppDefinitionLoaderInstance';

// AppInstallation is an environment-scoped entity:
// we cache loaders per space-environment.
const perSpaceEnvCache = {};

export function getAppsRepo() {
  const spaceContext = getSpaceContext();
  const spaceId = spaceContext.getId();
  const environmentId = spaceContext.getEnvironmentId();

  let repo: AppsRepo = get(perSpaceEnvCache, [spaceId, environmentId]);

  if (!repo) {
    repo = new AppsRepo(spaceContext.cma, getAppDefinitionLoader());
    set(perSpaceEnvCache, [spaceId, environmentId], repo);
  }

  return repo;
}
