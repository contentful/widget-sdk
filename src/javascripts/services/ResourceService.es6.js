import { getCurrentVariation } from 'utils/LaunchDarkly';
import { canCreate, generateMessage } from 'utils/ResourceUtils';
import { createSpaceEndpoint, createOrganizationEndpoint } from 'data/Endpoint';
import { apiUrl } from 'Config';
import * as auth from 'Authentication';
import spaceContext from 'spaceContext';

import $q from '$q';
import { assign } from 'lodash';

/*
{
  "total": 1,
  "limit": 25,
  "skip": 0,
  "sys": {
    "type": "Array"
  },
  "items": [
    {
      "name": "Entries",
      "kind": "permanent",
      "usage": 900,
      "limits": null,
      "parent": {
        "name": "Records",
        "kind": "permanent",
        "usage": 900,
        "limits": {
          "included": 2000,
          "maximum": 2500
        },
        "sys": {
          "id": "records",
          "type": "SpaceResource"
        }
      },
      "sys": {
        "id": "entries",
        "type": "SpaceResource"
      }
    },
    {
      "name": "API keys",
      "kind": "permanent",
      "usage": 2,
      "limits": {
        "included": 5,
        "maximum": 5
      },
      "parent": null,
      "sys": {
        "id": "api_keys",
        "type": "SpaceResource"
      }
    }
  ]
}
 */

const flagName = 'feature-bv-2018-01-resources-api';

/*
  The resourceTypeMap is necessary for bridging between pricing
  Version 1 (legacy) and Version 2, as well as making it easier to
  notice an incorrect key given for legacy. Once the feature flag is
  removed this can most likely also be removed or refactored.
 */
const resourceTypeMap = {
  space: 'spaces',
  spaceMembership: 'space_memberships',
  contentType: 'content_types',
  entry: 'entries',
  asset: 'assets',
  environment: 'environments',
  organizationMembership: 'organization_memberships',
  role: 'roles',
  locale: 'locales',
  apiKey: 'api_keys',
  webhookDefinition: 'webhook_definitions',
  record: 'records',
  apiRequest: 'api_requests'
};

export default function createResourceService (id) {
  // TODO: migrate this to use OrganizationEndpoint and SpaceEndpoint
  // once the OrganizationEndpoint is ready. Currently the Space endpoint
  // for resources (/space/:space_id/resources) handles all.
  //
  // NOTE: Also unskip the test in the spec related to this functionality
  const endpoint = createEndpoint('space', id);

  return {
    get: function (resourceType) {
      return $q(function (resolve, reject) {
        if (!resourceType) {
          return reject(new Error('resourceType not supplied to ResourceService.get'));
        }

        if (!resourceTypeMap[resourceType]) {
          return reject(new Error('Invalid resourceType supplied to ResourceService.get'));
        }

        return resolve(getCurrentVariation(flagName));
      }).then(flagValue => {
        if (flagValue === true) {
          const apiResourceType = resourceTypeMap[resourceType];

          return endpoint({
            method: 'GET',
            path: [ 'resources', apiResourceType ]
          });
        } else {
          const limit = getLegacyLimit(resourceType);
          const usage = getLegacyUsage(resourceType);

          return createResourceFromTokenData(resourceType, limit, usage);
        }
      }).then(function (raw) {
        if (raw.items.length === 0) {
          throw new Error(`Resource ${resourceType} does not exist for this space.`);
        }

        return raw.items[0];
      });
    },
    getAll: function () {
      return endpoint({
        method: 'GET',
        path: [ 'resources' ]
      }).then(function (raw) {
        return raw.items;
      });
    },
    canCreate: function (resourceType) {
      return this.get(resourceType).then(canCreate);
    },
    messagesFor: function (resourceType) {
      return this.get(resourceType).then(generateMessage);
    },
    messages: function () {
      return this.getAll().then(resources => resources.reduce((memo, resource) => {
        memo[resource.sys.id] = generateMessage(resource);

        return memo;
      }, {}));
    }
  };
}

function createEndpoint (type, id) {
  const endpointFactory = type === 'space' ? createSpaceEndpoint : createOrganizationEndpoint;

  return endpointFactory(apiUrl(), id, auth);
}

function createResourceFromTokenData (resourceType, limit, usage) {
  return {
    items: [
      {
        usage,
        limits: {
          included: limit,
          maximum: limit
        },
        sys: {
          id: resourceType,
          type: 'SpaceResource'
        }
      }
    ]
  };
}

function getLegacyLimit (resourceType) {
  const organization = spaceContext.organizationContext.organization;
  const allLimits = assign({},
    organization.subscriptionPlan.limits.permanent,
    organization.subscriptionPlan.limits.period
  );

  return allLimits[resourceType];
}

function getLegacyUsage (resourceType) {
  const organization = spaceContext.organizationContext.organization;
  const allUsages = assign({},
    organization.usage.permanent,
    organization.usage.period
  );

  return allUsages[resourceType];
}
