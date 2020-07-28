import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { Paragraph, Heading, TextLink } from '@contentful/forma-36-react-components';

import { joinAnd } from 'utils/StringUtils';
import { getEnabledFeatures } from 'utils/SubscriptionUtils';
import { websiteUrl } from 'Config';
import { isPartnerPlan } from 'account/pricing/PricingDataProvider';

const styles = {
  container: css({
    gridColumn: 1,
    gridRow: 1,
  }),
};

function BasePlan({ basePlan }) {
  const enabledFeaturesNames = basePlan ? getEnabledFeatures(basePlan).map(({ name }) => name) : [];
  const hasAnyPlanFeatures = enabledFeaturesNames.length > 0;
  const basePlanIsPartner = isPartnerPlan(basePlan);

  return (
    <div className={styles.container}>
      <Heading className="section-title">Platform</Heading>
      <Paragraph testId="subscription-page.base-plan-details">
        <b>{basePlan.name}</b>
        {hasAnyPlanFeatures && ` – includes ${joinAnd(enabledFeaturesNames)}. `}
        {!hasAnyPlanFeatures &&
          basePlanIsPartner &&
          ' – includes enterprise features. Please reach out to your Partner Manager to find out what they are. '}
        {!hasAnyPlanFeatures && !basePlanIsPartner && ' - doesn’t include enterprise features. '}
        {!basePlanIsPartner && (
          <TextLink
            href={websiteUrl('/pricing#feature-overview')}
            testId="subscription-page.org-usage-link"
            target="_blank"
            rel="noopener noreferrer">
            Platform features
          </TextLink>
        )}
      </Paragraph>
    </div>
  );
}

BasePlan.propTypes = {
  basePlan: PropTypes.object,
};

BasePlan.defaultProps = {
  basePlan: undefined,
};

export default BasePlan;
