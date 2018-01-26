import { getCurrentVariation } from 'utils/LaunchDarkly';
import { createSpaceEndpoint, createOrganizationEndpoint } from 'data/Endpoint';
import { getUsage, getLimit } from 'enforcements';
import { apiUrl } from 'Config';
import * as auth from 'Authentication';

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

export default function createResourceService (id, type = 'space') {
  const endpoint = createEndpoint(type, id);

  return {
    get: function (resourceType) {
      if (!resourceType) {
        throw new Error('resourceType not supplied to ResourceService.get');
      }

      return getCurrentVariation(flagName).then(flagValue => {
        if (flagValue === true) {
          return endpoint({
            method: 'GET',
            path: [ 'resources', resourceType ]
          });
        } else {
          const limit = getLimit(resourceType);
          const usage = getUsage(resourceType);

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
