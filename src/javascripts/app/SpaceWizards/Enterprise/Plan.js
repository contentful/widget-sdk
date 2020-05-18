import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import PlanFeatures from '../shared/PlanFeatures';

const styles = {
  item: css({
    marginBottom: '30px',
  }),
};

export default function Plan(props) {
  const { resources, roleSet, usage, limit, disabled, reachedLimit, name } = props;

  return (
    <div
      data-test-id="space-plans-list.item"
      className={`
          space-plans-list__item
          space-plans-list__item--proof-of-concept
          ${styles.item}
          ${(disabled || reachedLimit) && 'space-plans-list__item--disabled'}
        `}>
      <div className="space-plans-list__item__heading">
        <strong data-test-id="space-plan-name">{name}</strong>
        <span data-test-id="space-plan-price">
          {' '}
          - {limit === 0 ? 'unavailable' : `${usage}/${limit} used`}
        </span>
      </div>
      <PlanFeatures resources={resources} roleSet={roleSet} disabled={disabled} />
    </div>
  );
}

Plan.propTypes = {
  resources: PropTypes.array.isRequired,
  roleSet: PropTypes.object.isRequired,
  usage: PropTypes.number.isRequired,
  limit: PropTypes.number.isRequired,
  disabled: PropTypes.bool.isRequired,
  reachedLimit: PropTypes.bool.isRequired,
  name: PropTypes.string.isRequired,
};
