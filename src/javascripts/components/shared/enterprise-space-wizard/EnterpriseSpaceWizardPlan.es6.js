import React from 'react';
import PropTypes from 'prop-types';

import PlanFeatures from 'components/shared/space-wizard/PlanFeatures.es6';

export default class EnterpriseSpaceWizardPlan extends React.Component {
  static propTypes = {
    resources: PropTypes.array.isRequired,
    roleSet: PropTypes.object.isRequired,
    usage: PropTypes.number.isRequired,
    limit: PropTypes.number.isRequired,
    isDisabled: PropTypes.bool.isRequired,
    reachedLimit: PropTypes.bool.isRequired
  };

  render() {
    const { isDisabled, reachedLimit, usage, limit, resources, roleSet } = this.props;
    return (
      <div
        className={`
          space-plans-list__item
          space-plans-list__item--proof-of-concept
          ${(isDisabled || reachedLimit) && 'space-plans-list__item--disabled'}
        `}
        style={{ marginBottom: '30px' }}>
        <div className="space-plans-list__item__heading">
          <strong data-test-id="space-plan-name">Proof of concept</strong>
          <span data-test-id="space-plan-price">
            {' '}
            - {isDisabled ? 'unavailable' : `${usage}/${limit} used`}
          </span>
        </div>
        <PlanFeatures resources={resources} roleSet={roleSet} />
      </div>
    );
  }
}
