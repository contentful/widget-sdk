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

export async function getCreatorNameOf(entry) {
  const { firstName, lastName } = await getUser(
    createOrgEndpointByDef(entry),
    entry.sys.createdBy.sys.id
  );

  return `${firstName} ${lastName}`;
}

export function addKey({ orgId, definitionId, jwk }) {
  const orgEndpoint = createOrganizationEndpoint(Config.apiUrl(), orgId, Auth);

  return orgEndpoint({
    method: 'POST',
    data: { jwk },
    path: ['app_definitions', definitionId, 'keys'],
  });
}

export function revokeKey({ orgId, definitionId, fingerprint }) {
  const orgEndpoint = createOrganizationEndpoint(Config.apiUrl(), orgId, Auth);

  return orgEndpoint({
    method: 'DELETE',
    path: ['app_definitions', definitionId, 'keys', fingerprint],
  });
}

export function updateAppEvents(orgId, definitionId, { targetUrl, topics }) {
  const orgEndpoint = createOrganizationEndpoint(Config.apiUrl(), orgId, Auth);
  return orgEndpoint({
    method: 'PUT',
    data: { targetUrl, topics },
    path: ['app_definitions', definitionId, 'event_subscription'],
  });
}

export function deleteAppEvents(orgId, definitionId) {
  const orgEndpoint = createOrganizationEndpoint(Config.apiUrl(), orgId, Auth);

  return orgEndpoint({
    method: 'DELETE',
    path: ['app_definitions', definitionId, 'event_subscription'],
  });
}
