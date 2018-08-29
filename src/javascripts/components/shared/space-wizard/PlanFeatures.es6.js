import React from 'react';
import PropTypes from 'prop-types';

import { getTooltip } from 'components/shared/space-wizard/WizardUtils';
import pluralize from 'pluralize';
import { toLocaleString } from 'utils/NumberUtils';
import Tooltip from 'ui/Components/Tooltip';

export default function PlanFeatures({ resources }) {
  return (
    <ul className="space-plans-list__item__features">
      {resources.map(({ type, number }) => {
        const tooltip = getTooltip(type, number);
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
  resources: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      number: PropTypes.number.isRequired
    })
  )
};
