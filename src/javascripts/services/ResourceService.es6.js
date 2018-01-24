import { getCurrentVariation } from 'utils/LaunchDarkly';
// import { getUsage, getLimit } from 'enforcements';

import { get, map, partialRight, merge } from 'lodash';

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

const flagName = 'resource-based-access-control';

// Organization is passed here to deal with circular dependencies
//
// It won't be necessary when the feature flag is removed.
export default function createResourceService (endpoint, organization) {
  return {
    get: function (resourceType) {
      return getCurrentVariation(flagName).then(flagValue => {
        if (flagValue === true) {
          return endpoint({
            method: 'GET',
            path: [ 'resources', resourceType ]
          });
        } else {
          const limit = getLegacyLimit(organization, resourceType);
          const usage = getLegacyUsage(organization, resourceType);

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
      return this.get(resourceType).then(resourceMaximumLimitReached);
    },
    messagesFor: function (resourceType) {
      return this.get(resourceType).then(generateMessage);
    },
    messages: function () {
      return this.getAll().then(partialRight(generateMessage, map));
    }
  };
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

function getLegacyUsage (organization, resourceType) {
  return get(merge(
    organization.usage.permanent,
    organization.usage.period
  ), resourceType);
}

function getLegacyLimit (organization, resourceType) {
  return get(merge(
    organization.subscriptionPlan.limits.permanent,
    organization.subscriptionPlan.limits.period
  ), resourceType);
}

function resourceMaximumLimitReached (resource) {
  const limitMaximum = resource.limits.maximum;
  const usage = resource.usage;

  return usage >= limitMaximum;
}

function resourceIncludedLimitReached (resource) {
  const limitIncluded = resource.limits.maximum;
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
