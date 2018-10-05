import React from 'react';
import PropTypes from 'prop-types';

import { joinAnd } from 'utils/StringUtils.es6';

import { href } from 'states/Navigator.es6';
import { getEnabledFeatures } from 'utils/SubscriptionUtils.es6';
import { usage as orgUsage } from 'ui/NavStates/Org.es6';

function BasePlan({ basePlan, orgId }) {
  const enabledFeaturesNames = getEnabledFeatures(basePlan).map(({ name }) => name);

  return (
    <div className="platform">
      <h2 className="section-title">Platform</h2>
      <p data-test-id="subscription-page.base-plan-details">
        <b>{basePlan.name}</b>
        {enabledFeaturesNames.length
          ? ` – includes ${joinAnd(enabledFeaturesNames)}. `
          : ' – doesn’t include any additional features. '}
        <a
          className="text-link"
          href={href(orgUsage(orgId))}
          data-test-id="subscription-page.org-usage-link">
          View usage
        </a>
      </p>
    </div>
  );
}

BasePlan.propTypes = {
  basePlan: PropTypes.object.isRequired,
  orgId: PropTypes.string.isRequired
};

export default BasePlan;
