import { getModule } from 'NgRegistry';
import * as Auth from 'Authentication';
import * as Config from 'Config';
import createAppDefinitionLoader from 'app/settings/AppsBeta/AppDefinitionLoader';
import { createOrganizationEndpoint, createAppDefinitionsEndpoint } from 'data/Endpoint';

// AppDefinition is an organization-scoped entity:
// we cache loaders per organization.
const perOrgCache = {};

export function getAppDefinitionLoader() {
  const spaceContext = getModule('spaceContext');
  const orgId = spaceContext.getData(['organization', 'sys', 'id']);
  const orgEndpoint = createOrganizationEndpoint(Config.apiUrl(), orgId, Auth);

  let loader = perOrgCache[orgId];

  if (!loader) {
    const appDefinitionsEndpoint = createAppDefinitionsEndpoint(Config.apiUrl(), Auth);
    loader = createAppDefinitionLoader(appDefinitionsEndpoint, orgEndpoint);
    perOrgCache[orgId] = loader;
  }

  return loader;
}
