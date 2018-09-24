import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { upperFirst, lowerCase, get } from 'lodash';
import { joinWithAnd } from 'utils/StringUtils.es6';
import pluralize from 'pluralize';

import { resourceHumanNameMap } from 'utils/ResourceUtils.es6';

export const SpaceResourceTypes = {
  Environments: 'Environments',
  Roles: 'Roles',
  Locales: 'Locales',
  ContentTypes: 'Content types',
  Records: 'Records'
};

// Threshold for usage limit displaying/causing an error (100% usage e.g. limit reached)
const ERROR_THRESHOLD = 1;

// Threshold for usage limit displaying a warning (80% usage, e.g. near limit)
const WARNING_THRESHOLD = 0.8;

const resourceTooltipPropTypes = {
  number: PropTypes.number.isRequired
};

function EnvironmentsTooltip({ number }) {
  return (
    <div>
      <p>
        This space type includes 1 master and {pluralize('sandbox environment', number - 1, true)}.
      </p>
      <p>
        Environments allow you to create and maintain multiple versions of the space-specific data,
        and make changes to them in isolation.
      </p>
    </div>
  );
}
EnvironmentsTooltip.propTypes = resourceTooltipPropTypes;

export function getRolesTooltip(limit, roleSet) {
  const roles = ['Admin', ...roleSet.roles];
  // all roles joined by comma and `and`
  const rolesString = joinWithAnd(roles, false);
  const pluralized = pluralize('role', roles.length);
  const hasAdminOnly = limit === 1;

  // has many translator roles
  const translator = 'Translator';
  const translatorRolesCount = roles.filter(name => name.includes(translator)).length;
  const withoutTranslator = roles.filter(name => !name.includes(translator)).join(', ');
  const hasMultipleTranslators = translatorRolesCount > 1;

  // has limits greater than number of roles in role set
  const hasCustomRoles = limit > roles.length;
  const customRolesNumber = limit - roles.length;
  const customRolesString = `${customRolesNumber > 1 ? customRolesNumber : ''} ${pluralize(
    'custom roles',
    customRolesNumber
  )}`;

  const intro = 'This space type includes the';

  if (hasAdminOnly) {
    return `${intro} Admin role only`;
  } else if (hasMultipleTranslators) {
    // e.g. [...] Admin, Editor and 10 Translator roles
    return `${intro} ${withoutTranslator} and ${translatorRolesCount} Translator roles`;
  } else if (hasCustomRoles) {
    // e.g. [...] Admin, Editor and an additional 10 custom roles
    return `${intro} ${rolesString} ${pluralized} and an additional ${customRolesString}`;
  } else {
    // e.g. [...] Admin, Editor and Translator roles
    return `${intro} ${rolesString} ${pluralized}`;
  }
}

const ResourceTooltips = {
  [SpaceResourceTypes.Environments]: EnvironmentsTooltip,
  [SpaceResourceTypes.Records]: () => 'Records are entries and assets combined.'
};

export const Steps = {
  SpaceCreateSteps: {
    SpaceType: 'space_type',
    SpaceDetails: 'space_details',
    Confirmation: 'confirmation'
  },
  SpaceChangeSteps: {
    SpaceType: 'space_type',
    Confirmation: 'confirmation'
  }
};

export const RequestState = {
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error'
};

export function formatPrice(value) {
  if (!Number.isFinite(value)) {
    return null;
  }

  return parseFloat(value, 10).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

export function unavailabilityTooltipNode(plan) {
  const reasonsMeta = {};

  if (!plan.unavailabilityReasons) {
    return null;
  }

  plan.unavailabilityReasons.forEach(reason => {
    if (!reasonsMeta[reason.type]) {
      reasonsMeta[reason.type] = [];
    }

    reasonsMeta[reason.type].push({
      additionalInfo: reason.additionalInfo,
      usage: reason.usage,
      maximumLimit: reason.maximumLimit
    });
  });

  let resourceOverageNode;

  if (reasonsMeta.maximumLimitExceeded) {
    const resourceOverageText = joinWithAnd(
      reasonsMeta.maximumLimitExceeded.map(ov => {
        const additionalUsage = ov.usage - ov.maximumLimit;
        const resourceName = lowerCase(ov.additionalInfo);

        return `${additionalUsage} ${resourceName}`;
      })
    );

    resourceOverageNode = (
      <p>
        You are currently using more than the {plan.name} space allows by {resourceOverageText}.
      </p>
    );
  }

  const mappedMeta = Object.keys(reasonsMeta).map(key => {
    const value = reasonsMeta[key];

    if (key === 'roleIncompatibility') {
      const multipleRoles = value.length > 1;
      const roles = joinWithAnd(value.map(v => v.additionalInfo));

      return `migrate users from the ${roles} role${multipleRoles ? 's' : ''}`;
    } else if (key === 'maximumLimitExceeded') {
      return 'delete resources';
    } else if (key === 'freeSpacesMaximumLimitReached') {
      return 'delete or upgrade one of your free spaces';
    }
  });

  return (
    <Fragment>
      {resourceOverageNode && resourceOverageNode}

      <p>{upperFirst(joinWithAnd(mappedMeta))} before changing to this space type.</p>
    </Fragment>
  );
}

export function getTooltip(type, number) {
  return ResourceTooltips[type] && ResourceTooltips[type]({ number });
}

export function getFieldErrors(error) {
  const errors = get(error, 'body.details.errors') || [];

  return errors.reduce((acc, err) => {
    let message;
    if (err.path === 'name' && err.name === 'length') {
      message = 'Space name is too long';
    } else {
      message = `Value "${err.value}" is invalid`;
    }
    acc[err.path] = message;
    return acc;
  }, {});
}

/*
  Returns the plan that would fulfill your resource usage, given a set of space rate plans and
  the current space resources (usage/limits).
 */
export function getRecommendedPlan(spaceRatePlans = [], resources) {
  // Valid plans are only ones that have no unavailablilty reasons
  const validPlans = spaceRatePlans.filter(plan => !get(plan, 'unavailabilityReasons'));

  if (!resources || validPlans.length === 0) {
    return null;
  }

  // Find the first plan that has all true fulfillments, e.g. the status is "true" for all of the given fulfillments
  // for a given space rate plan, which means the plan fulfills the given resource usage
  const recommendedPlan = validPlans.find(plan => {
    const statuses = Object.values(getPlanResourceFulfillment(plan, resources));

    if (statuses.length === 0) {
      return false;
    }

    return statuses.reduce((fulfills, { reached }) => fulfills && !reached, true);
  });

  if (!recommendedPlan) {
    return null;
  }

  return recommendedPlan;
}

/*
  Returns the space plan relative resource usage information (resource fulfillment) based on
  the current resource usage.

  Returns an object, keyed by the resource name, which has values that are objects with
  two keys, `reached` and `near`:

  {
    'Content types': {
      reached: true,
      near: true
    },
    'Environments': {
      reached: false,
      near: true
    }
  }

  `reached` denotes that, if the user were to change to this space plan, that they would
  either be at the limit or over the limit, which means it doesn't make sense to recommend them
  this space plan.

  `near` denotes that, if the user were to change to this space plan, that they would not be at
  the limit, but would be near it and should be aware during the recommendation process.

 */
export function getPlanResourceFulfillment(plan, spaceResources = []) {
  const planIncludedResources = plan.includedResources;

  return planIncludedResources.reduce((fulfillments, planResource) => {
    const typeLower = planResource.type.toLowerCase();
    const spaceResource = spaceResources.find(r => {
      const mappedId = resourceHumanNameMap[get(r, 'sys.id')].toLowerCase();

      return mappedId === typeLower;
    });

    if (!spaceResource) {
      return fulfillments;
    } else {
      const usagePercentage = spaceResource.usage / planResource.number;

      if (usagePercentage >= ERROR_THRESHOLD) {
        fulfillments[planResource.type] = {
          reached: true,
          near: true
        };
      } else if (usagePercentage >= WARNING_THRESHOLD) {
        fulfillments[planResource.type] = {
          reached: false,
          near: true
        };
      } else {
        fulfillments[planResource.type] = {
          reached: false,
          near: false
        };
      }

      return fulfillments;
    }
  }, {});
}

export function getIncludedResources(charges) {
  const ResourceTypes = {
    Environments: 'Environments',
    Roles: 'Roles',
    Locales: 'Locales',
    ContentTypes: 'Content types',
    Records: 'Records'
  };

  return Object.values(ResourceTypes).map(type => {
    const charge = charges.find(({ name }) => name === type);
    let number = get(charge, 'tiers[0].endingUnit');

    // Add "extra" environment and role to include `master` and `admin`
    if ([ResourceTypes.Environments, ResourceTypes.Roles].includes(type)) {
      number = number + 1;
    }

    return { type, number };
  });
}

/*
  Returns tracking data for `feature_space_wizard` schema from the Wizard component properties.
 */
export function createTrackingData(data) {
  const {
    action,
    paymentDetailsExist,
    currentStepId,
    targetStepId,
    selectedPlan,
    currentPlan,
    recommendedPlan,
    newSpaceName,
    newSpaceTemplate,
    spaceId
  } = data;

  const trackingData = {
    currentStep: currentStepId || null,
    targetStep: targetStepId || null,
    intendedAction: action,
    paymentDetailsExist: typeof paymentDetailsExist === 'boolean' ? paymentDetailsExist : null,
    targetSpaceType: get(selectedPlan, 'internalName', null),
    targetProductType: get(selectedPlan, 'productType', null),
    targetSpaceName: newSpaceName || null,
    targetSpaceTemplateId: get(newSpaceTemplate, 'name', null),
    currentSpaceType: get(currentPlan, 'internalName', null),
    currentProductType: get(currentPlan, 'productType', null),
    recommendedSpaceType: get(recommendedPlan, 'internalName', null),
    recommendedProductType: get(recommendedPlan, 'productType', null)
  };

  if (spaceId) {
    trackingData.spaceId = spaceId;
  }

  return trackingData;
}
