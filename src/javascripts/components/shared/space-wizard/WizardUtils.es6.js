import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { upperFirst, lowerCase, get } from 'lodash';
import { joinWithAnd } from 'utils/StringUtils';
import pluralize from 'pluralize';

export const SpaceResourceTypes = {
  Environments: 'Environments',
  Roles: 'Roles',
  Locales: 'Locales',
  ContentTypes: 'Content types',
  Records: 'Records'
};

const resourceTooltipPropTypes = {
  number: PropTypes.number.isRequired
};

function EnvironmentsTooltip ({number}) {
  return <div>
    <p>This space type includes 1 master and {pluralize('sandbox environment', number - 1, true)}.</p>
    <p>
      Environments allow you to create and
      maintain multiple versions of the space-specific data, and make changes to them
      in isolation.
    </p>
  </div>;
}
EnvironmentsTooltip.propTypes = resourceTooltipPropTypes;

function RolesTooltip ({number}) {
  return <Fragment>
    This space type includes the admin role
    { number === 1 ? ' only.' : ` and ${pluralize('additional role', number - 1, true)}.`}
  </Fragment>;
}
RolesTooltip.propTypes = resourceTooltipPropTypes;

const ResourceTooltips = {
  [SpaceResourceTypes.Environments]: EnvironmentsTooltip,
  [SpaceResourceTypes.Roles]: RolesTooltip,
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

export function formatPrice (value) {
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

export function getTooltip (type, number) {
  return ResourceTooltips[type] && ResourceTooltips[type]({number});
}

export function getFieldErrors (error) {
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
