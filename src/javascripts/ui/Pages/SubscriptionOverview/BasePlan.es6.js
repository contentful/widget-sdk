import React from 'react';
import PropTypes from 'prop-types';

import { joinAnd } from 'utils/StringUtils.es6';

import { getEnabledFeatures } from 'utils/SubscriptionUtils.es6';
import { websiteUrl } from 'Config.es6';

function BasePlan({ basePlan }) {
  const enabledFeaturesNames = getEnabledFeatures(basePlan).map(({ name }) => name);

  return (
    <div className="platform">
      <h2 className="section-title">Platform</h2>
      <p data-test-id="subscription-page.base-plan-details">
        <b>{basePlan.name}</b>
        {enabledFeaturesNames.length
          ? ` – includes ${joinAnd(enabledFeaturesNames)}. `
          : ' – doesn’t include enterprise features. '}
        <a
          className="text-link"
          href={websiteUrl('/pricing/#platform-features')}
          data-test-id="subscription-page.org-usage-link">
          Platform features
        </a>
      </p>
    </div>
  );
}

BasePlan.propTypes = {
  basePlan: PropTypes.object.isRequired
};

export default BasePlan;
