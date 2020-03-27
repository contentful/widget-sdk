import { get, omit } from 'lodash';
import * as Auth from 'Authentication';
import * as Config from 'Config';
import { createOrganizationEndpoint } from 'data/Endpoint';
import { getUser } from 'access_control/OrganizationMembershipRepository';

function createOrgEndpointByDef(definition) {
  const orgId = get(definition, ['sys', 'organization', 'sys', 'id']);
  return createOrganizationEndpoint(Config.apiUrl(), orgId, Auth);
}

export function createDefinitionTemplateForOrg(orgId) {
  if (typeof orgId !== 'string' || !orgId) {
    throw new Error('orgId must be a string!');
  }

  return {
    sys: {
      organization: {
        sys: {
          type: 'Link',
          linkType: 'Organization',
          id: orgId,
        },
      },
    },
  };
}

export function save(definition) {
  const orgEndpoint = createOrgEndpointByDef(definition);
  const id = get(definition, ['sys', 'id']);

  const isPersisted = typeof id === 'string';
  const method = isPersisted ? 'PUT' : 'POST';

  return orgEndpoint({
    method,
    path: ['app_definitions'].concat(isPersisted ? [id] : []),
    data: omit(definition, ['sys']),
  });
}

export function deleteDef(definition) {
  const orgEndpoint = createOrgEndpointByDef(definition);
  const id = get(definition, ['sys', 'id']);

  return orgEndpoint({
    method: 'DELETE',
    path: ['app_definitions', id],
  });
}

export async function getCreatorNameOf(definition) {
  const { firstName, lastName } = await getUser(
    createOrgEndpointByDef(definition),
    definition.sys.createdBy.sys.id
  );

  return [firstName, lastName].join(' ');
}
