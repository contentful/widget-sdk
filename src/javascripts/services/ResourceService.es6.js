import { getCurrentVariation } from 'utils/LaunchDarkly';
import { createSpaceEndpoint, createOrganizationEndpoint } from 'data/Endpoint';
import { apiUrl } from 'Config';
import * as auth from 'Authentication';
import spaceContext from 'spaceContext';

import { merge } from 'lodash';

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
  Version 1 (legacy) and Version 2. Once the feature flag is
  removed this can most likely also be removed or refactored.
 */
const resourceTypeMap = {
  spaces: 'spaces',
  spaceMemberships: 'space_memberships',
  contentTypes: 'content_types',
  entries: 'entries',
  assets: 'assets',
  environments: 'environments',
  organizationMemberships: 'organization_memberships',
  roles: 'roles',
  locales: 'locales',
  apiKeys: 'api_keys',
  webhookDefinitions: 'webhook_definitions',
  records: 'records',
  apiRequests: 'api_requests'
};

export default function createResourceService (id) {
  // TODO: migrate this to use OrganizationEndpoint and SpaceEndpoint
  // once the OrganizationEndpoint is ready
  // NOTE: Also unskip the test in the spec related to this functionality
  const endpoint = createEndpoint('space', id);

  return {
    get: function (resourceType) {
      if (!resourceType) {
        throw new Error('resourceType not supplied to ResourceService.get');
      }

      if (!resourceTypeMap[resourceType]) {
        throw new Error('Invalid resourceType supplied to ResourceService.get');
      }

      return getCurrentVariation(flagName).then(flagValue => {
        if (flagValue === true) {
          return endpoint({
            method: 'GET',
            path: [ 'resources', resourceType ]
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
      return this.get(resourceType).then(resource => !resourceMaximumLimitReached(resource));
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
  const allLimits = merge(
    organization.subscriptionPlan.limits.permanent,
    organization.subscriptionPlan.limits.period
  );

  return allLimits[resourceType];
}

function getLegacyUsage (resourceType) {
  const organization = spaceContext.organizationContext.organization;
  const allUsages = merge(
    organization.usage.permanent,
    organization.usage.period
  );

  return allUsages[resourceType];
}

function getResourceLimits (resource) {
  if (!resource.parent && !resource.limits) {
    return null;
  }

  if (resource.limits) {
    return resource.limits;
  } else if (resource.parent) {
    return getResourceLimits(resource.parent);
  }
}

function resourceMaximumLimitReached (resource) {
  const limitMaximum = getResourceLimits(resource).maximum;
  const usage = resource.usage;

  return usage >= limitMaximum;
}

function resourceIncludedLimitReached (resource) {
  const limitIncluded = getResourceLimits(resource).included;
  const usage = resource.usage;

  return usage >= limitIncluded;
}

function generateMessage (resource) {
  const resourceName = resource.name;

  let warning;
  let error;

  if (resourceIncludedLimitReached(resource)) {
    warning = `You are near the limit of your ${resourceName} resource.`;
  }

  if (resourceMaximumLimitReached(resource)) {
    error = `You have exceeded your ${resourceName} usage.`;
  }

  return {
    warning,
    error
  };
}
