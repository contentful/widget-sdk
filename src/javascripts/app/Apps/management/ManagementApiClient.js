import { get, omit } from 'lodash';
import * as Auth from 'Authentication';
import * as Config from 'Config';
import { createOrganizationEndpoint } from 'data/Endpoint';

export function save(definition) {
  const orgId = get(definition, ['sys', 'organization', 'sys', 'id']);
  const id = get(definition, ['sys', 'id']);

  const orgEndpoint = createOrganizationEndpoint(Config.apiUrl(), orgId, Auth);

  const isPersisted = typeof id === 'string';
  const method = isPersisted ? 'PUT' : 'POST';

  return orgEndpoint({
    method,
    path: ['app_definitions'].concat(isPersisted ? [id] : []),
    data: omit(definition, ['sys'])
  });
}
