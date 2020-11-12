import { get } from 'lodash';
import * as Auth from 'Authentication';
import * as Config from 'Config';
import { createOrganizationEndpoint } from 'data/Endpoint';
import { getUser } from 'access_control/OrganizationMembershipRepository';
import { WidgetLocation } from '@contentful/widget-renderer';

const VALIDATION_MESSAGE =
  'Validation failed. Please check that you have provided valid configuration options.';

function createOrgEndpointByDef(definition) {
  const orgId = get(definition, ['sys', 'organization', 'sys', 'id']);
  return createOrganizationEndpoint(Config.apiUrl(), orgId, Auth);
}

function createDefinitionTemplateForOrg(orgId) {
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

function save(definition) {
  const orgEndpoint = createOrgEndpointByDef(definition);
  const id = get(definition, ['sys', 'id']);

  const isPersisted = typeof id === 'string';
  const method = isPersisted ? 'PUT' : 'POST';

  const widgetConfig = {
    src: definition.src,
    locations: definition.locations || [],
    parameters: {
      instance: definition?.parameters?.instance ?? [],
    },
  };
  const dialogLocation = widgetConfig.locations.find((l) => l.location === WidgetLocation.DIALOG);
  if (!dialogLocation) {
    widgetConfig.locations = [...widgetConfig.locations, { location: WidgetLocation.DIALOG }];
  }

  return orgEndpoint({
    method,
    path: ['app_definitions'].concat(isPersisted ? [id] : []),
    data: {
      name: definition.name,
      ...(definition.src ? widgetConfig : {}),
    },
  });
}

function deleteDef(definition) {
  const orgEndpoint = createOrgEndpointByDef(definition);
  const id = get(definition, ['sys', 'id']);

  return orgEndpoint({
    method: 'DELETE',
    path: ['app_definitions', id],
  });
}

async function getCreatorNameOf(entry) {
  const { firstName, lastName } = await getUser(
    createOrgEndpointByDef(entry),
    entry.sys.createdBy.sys.id
  );

  return `${firstName} ${lastName}`;
}

function addKey({ orgId, definitionId, jwk }) {
  const orgEndpoint = createOrganizationEndpoint(Config.apiUrl(), orgId, Auth);

  return orgEndpoint({
    method: 'POST',
    data: { jwk },
    path: ['app_definitions', definitionId, 'keys'],
  });
}

function generateKey({ orgId, definitionId }) {
  const orgEndpoint = createOrganizationEndpoint(Config.apiUrl(), orgId, Auth);

  return orgEndpoint({
    method: 'POST',
    data: { generate: true },
    path: ['app_definitions', definitionId, 'keys'],
  });
}

function revokeKey({ orgId, definitionId, fingerprint }) {
  const orgEndpoint = createOrganizationEndpoint(Config.apiUrl(), orgId, Auth);

  return orgEndpoint({
    method: 'DELETE',
    path: ['app_definitions', definitionId, 'keys', fingerprint],
  });
}

function updateAppEvents(orgId, definitionId, { targetUrl, topics }) {
  const orgEndpoint = createOrganizationEndpoint(Config.apiUrl(), orgId, Auth);
  return orgEndpoint({
    method: 'PUT',
    data: { targetUrl, topics },
    path: ['app_definitions', definitionId, 'event_subscription'],
  });
}

function deleteAppEvents(orgId, definitionId) {
  const orgEndpoint = createOrganizationEndpoint(Config.apiUrl(), orgId, Auth);

  return orgEndpoint({
    method: 'DELETE',
    path: ['app_definitions', definitionId, 'event_subscription'],
  });
}

function addAppSigningSecret(orgId, definitionId, value) {
  const orgEndpoint = createOrganizationEndpoint(Config.apiUrl(), orgId, Auth);

  return orgEndpoint({
    method: 'PUT',
    data: { value },
    path: ['app_definitions', definitionId, 'signing_secret'],
  });
}

export const ManagementApiClient = {
  createDefinitionTemplateForOrg,
  save,
  deleteDef,
  getCreatorNameOf,
  addKey,
  generateKey,
  revokeKey,
  updateAppEvents,
  deleteAppEvents,
  addAppSigningSecret,
  VALIDATION_MESSAGE,
};
