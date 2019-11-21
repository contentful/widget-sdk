import get from 'lodash/get';
import { getModule } from 'NgRegistry';
import * as Auth from 'Authentication';
import * as Config from 'Config';
import createAppDefinitionLoader from 'app/settings/AppsBeta/AppDefinitionLoader';
import { createOrganizationEndpoint, createAppDefinitionsEndpoint } from 'data/Endpoint';

const perSpaceCache = {};

export function getAppDefinitionLoader() {
  const spaceContext = getModule('spaceContext');
  const spaceId = spaceContext.getId();
  const space = spaceContext.getSpace();
  const orgId = get(space, ['data', 'organization', 'sys', 'id']);
  const orgEndpoint = createOrganizationEndpoint(Config.apiUrl(), orgId, Auth);

  if (!perSpaceCache[spaceId]) {
    const appDefinitionsEndpoint = createAppDefinitionsEndpoint(Config.apiUrl(), Auth);

    perSpaceCache[spaceId] = createAppDefinitionLoader(appDefinitionsEndpoint, orgEndpoint);
  }

  return perSpaceCache[spaceId];
}
