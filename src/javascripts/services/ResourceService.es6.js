import { getSpace, getOrganization } from 'services/TokenStore';
import { canCreate, generateMessage } from 'utils/ResourceUtils';
import { runTask } from 'utils/Concurrent';
import { createSpaceEndpoint, createOrganizationEndpoint } from 'data/Endpoint';
import { apiUrl } from 'Config';
import * as auth from 'Authentication';

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

export default function createResourceService (id, type = 'space') {
  const endpoint = createEndpoint(id, type);

  return {
    get: function (resourceType) {
      return $q.resolve(runTask(function* () {
        if (!resourceType) {
          throw new Error('resourceType not supplied to ResourceService.get');
        }

        if (!resourceTypeMap[resourceType]) {
          throw new Error('Invalid resourceType supplied to ResourceService.get');
        }

        const organization = yield getTokenOrganization(id, type);
        const pricingVersion = organization.pricingVersion;

        if (pricingVersion === 'pricing_version_2') {
          const apiResourceType = resourceTypeMap[resourceType];

          return yield endpoint({
            method: 'GET',
            path: [ 'resources', apiResourceType ]
          });
        } else {
          const limit = getLegacyLimit(resourceType, organization);
          const usage = getLegacyUsage(resourceType, organization);

          return createResourceFromTokenData(resourceType, limit, usage);
        }
      }));
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

function createEndpoint (id, type) {
  const endpointFactory = type === 'space' ? createSpaceEndpoint : createOrganizationEndpoint;

  return endpointFactory(apiUrl(), id, auth);
}

function createResourceFromTokenData (resourceType, limit, usage) {
  return {
    usage,
    limits: {
      included: limit,
      maximum: limit
    },
    sys: {
      id: resourceType,
      type: 'SpaceResource'
    }
  };
}

function getTokenOrganization (id, type) {
  let promise;

  if (type === 'space') {
    promise = getSpace(id).then(space => {
      return space.organization;
    });
  } else if (type === 'organization') {
    promise = getOrganization(id);
  }

  return promise;
}

function getLegacyLimit (resourceType, organization) {
  const allLimits = assign({},
    organization.subscriptionPlan.limits.permanent,
    organization.subscriptionPlan.limits.period
  );

  return allLimits[resourceType];
}

function getLegacyUsage (resourceType, organization) {
  const allUsages = assign({},
    organization.usage.permanent,
    organization.usage.period
  );

  return allUsages[resourceType];
}
