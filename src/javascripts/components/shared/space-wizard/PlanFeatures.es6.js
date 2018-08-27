import React from 'react';
import PropTypes from 'prop-types';

import { getTooltip, SpaceResourceTypes, getRolesTooltip } from 'components/shared/space-wizard/WizardUtils';
import pluralize from 'pluralize';
import { toLocaleString } from 'utils/NumberUtils';
import Tooltip from 'ui/Components/Tooltip';

export default function PlanFeatures ({ resources, roleSet }) {
  return (
    <ul className="space-plans-list__item__features">
      {resources.map(({type, number}) => {
        const tooltip = type === SpaceResourceTypes.Roles
          ? getRolesTooltip(number, roleSet)
          : getTooltip(type, number);

        return (
          <li key={type}>
            {toLocaleString(number) + ' '}
            {tooltip && (
              <Tooltip style={{ display: 'inline' }} tooltip={tooltip}>
                <em className="x--underline">{pluralize(type, number)}</em>
              </Tooltip>
            )}
            {!tooltip && pluralize(type, number)}
          </li>
        );
      })}
    </ul>
  );
}
PlanFeatures.propTypes = {
  resources: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.string.isRequired,
    number: PropTypes.number.isRequired
  })),
  roleSet: PropTypes.shape({
    name: PropTypes.string,
    roles: PropTypes.arrayOf(PropTypes.string)
  }).isRequired
};
