import { upperFirst } from 'lodash';
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

export function unavailabilityTooltipText (plan) {
  const reasonsMeta = {};

  if (!plan.unavailabilityReasons) {
    return null;
  }

  plan.unavailabilityReasons.forEach(reason => {
    if (!reasonsMeta[reason.type]) {
      reasonsMeta[reason.type] = [];
    }

    reasonsMeta[reason.type].push(reason.additionalInfo);
  });

  const mappedMeta = Object.keys(reasonsMeta).map(key => {
    const value = reasonsMeta[key];

    if (key === 'roleIncompatibility') {
      const multipleRoles = value.length > 1;
      const roles = joinWithAnd(value);

      return `migrate users from the ${roles} role${multipleRoles ? 's' : ''}`;
    } else if (key === 'maximumLimitExceeded') {
      return 'delete resources';
    } else if (key === 'freeSpacesMaximumLimitReached') {
      return 'delete or upgrade one of your free spaces';
    }
  });

  return `${upperFirst(joinWithAnd(mappedMeta))} before changing to this space type.`;
}
