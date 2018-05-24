import React, { Fragment } from 'react';
import { upperFirst, lowerCase } from 'lodash';
import { joinWithAnd } from 'utils/StringUtils';

export const Steps = {
  SpaceCreateSteps: {
    SpaceType: 0,
    SpaceDetails: 1,
    Confirmation: 2
  },
  SpaceChangeSteps: {
    SpaceType: 0,
    Confirmation: 1
  }
};

export const RequestState = {
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error'
};

export function formatPrice (value) {
  return parseInt(value, 10).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  });
}

export function unavailabilityTooltipNode (plan) {
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
    const resourceOverageText = joinWithAnd(reasonsMeta.maximumLimitExceeded.map(ov => {
      const additionalUsage = ov.usage - ov.maximumLimit;
      const resourceName = lowerCase(ov.additionalInfo);

      return `${additionalUsage} ${resourceName}`;
    }));

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
      { resourceOverageNode && resourceOverageNode }

      <p>
        {upperFirst(joinWithAnd(mappedMeta))} before changing to this space type.
      </p>
    </Fragment>
  );
}
