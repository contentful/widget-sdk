import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import {
  Paragraph,
  Heading,
  TextLink,
  SkeletonContainer,
  SkeletonBodyText,
  SkeletonDisplayText,
} from '@contentful/forma-36-react-components';

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
  const enabledFeaturesNames = basePlan ? getEnabledFeatures(basePlan).map(({ name }) => name) : [];

  return (
    <div className={styles.container}>
      {!basePlan ? (
        <>
          <SkeletonContainer svgHeight={30}>
            <SkeletonDisplayText className="section-title" />
          </SkeletonContainer>
          <SkeletonContainer svgHeight={90}>
            <SkeletonBodyText numberOfLines={4} />
          </SkeletonContainer>
        </>
      ) : (
        <>
          {' '}
          <Heading className="section-title">Platform</Heading>
          <Paragraph testId="subscription-page.base-plan-details">
            <b>{basePlan.name}</b>
            {enabledFeaturesNames.length
              ? ` – includes ${joinAnd(enabledFeaturesNames)}. `
              : ' – doesn’t include enterprise features. '}
            <TextLink
              href={websiteUrl('/pricing/#platform-features')}
              testId="subscription-page.org-usage-link"
              target="_blank"
              rel="noopener noreferrer">
              Platform features
            </TextLink>
          </Paragraph>
        </>
      )}
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
