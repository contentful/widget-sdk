import { getModule } from 'core/NgRegistry';
import * as Auth from 'Authentication';
import * as Config from 'Config';
import createAppDefinitionLoader from 'app/Apps/AppDefinitionLoader';
import { createOrganizationEndpoint, createAppDefinitionsEndpoint } from 'data/Endpoint';

// AppDefinition is an organization-scoped entity:
// we cache loaders per organization.
const perOrgCache = {};

function currentSpaceOrgId() {
  const spaceContext = getModule('spaceContext');

  return spaceContext.getData(['organization', 'sys', 'id']);
}

export function getAppDefinitionLoader(orgId) {
  orgId = orgId || currentSpaceOrgId();
  let loader = perOrgCache[orgId];

  if (!loader) {
    const appDefinitionsEndpoint = createAppDefinitionsEndpoint(Config.apiUrl(), Auth);
    const orgEndpoint = createOrganizationEndpoint(Config.apiUrl(), orgId, Auth);
    loader = createAppDefinitionLoader(appDefinitionsEndpoint, orgEndpoint);
    perOrgCache[orgId] = loader;
  }

  return loader;
}
