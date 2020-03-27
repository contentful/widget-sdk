import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { Paragraph, Heading, TextLink } from '@contentful/forma-36-react-components';

import { joinAnd } from 'utils/StringUtils';
import { getEnabledFeatures } from 'utils/SubscriptionUtils';
import { websiteUrl } from 'Config';

const styles = {
  container: css({
    gridColumn: 1,
    gridRow: 1,
  }),
};

function BasePlan({ basePlan }) {
  const enabledFeaturesNames = getEnabledFeatures(basePlan).map(({ name }) => name);

  return (
    <div className={styles.container}>
      <Heading className="section-title">Platform</Heading>
      <Paragraph testId="subscription-page.base-plan-details">
        <b>{basePlan.name}</b>
        {enabledFeaturesNames.length
          ? ` – includes ${joinAnd(enabledFeaturesNames)}. `
          : ' – doesn’t include enterprise features. '}
        <TextLink
          href={websiteUrl('/pricing/#platform-features')}
          testId="subscription-page.org-usage-link">
          Platform features
        </TextLink>
      </Paragraph>
    </div>
  );
}

BasePlan.propTypes = {
  basePlan: PropTypes.object.isRequired,
};

export default BasePlan;
