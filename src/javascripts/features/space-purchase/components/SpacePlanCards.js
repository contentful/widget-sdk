import React from 'react';
import PropTypes from 'prop-types';
import { cx, css } from 'emotion';

import { Card, Heading } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { PLATFORM_TYPES } from 'features/space-purchase/utils/platformContent';
import {
  SPACE_PLANS_CONTENT,
  SPACE_PURCHASE_TYPES,
} from 'features/space-purchase/utils/spacePurchaseContent';
import { ProductCard } from './ProductCard';

const styles = {
  chooseLaterCard: css({
    gridColumn: '1 / 4',
    marginTop: tokens.spacingL,
    opacity: 1,
    transition: 'opacity 0.2s ease-in-out',
    '& p': { fontWeight: tokens.fontWeightMedium },
  }),
  disabled: css({
    opacity: 0.3,
    pointerEvents: 'none',
  }),
};

export const SpacePlanCards = ({
  spaceRatePlans = [],
  selectedPlatform,
  selectedSpacePlan,
  orgHasPaidSpaces = false,
  onSelect,
}) => {
  return (
    <>
      {SPACE_PLANS_CONTENT.filter(
        (content) => content.type !== SPACE_PURCHASE_TYPES.ENTERPRISE
      ).map((spacePlanContent, idx) => {
        const plan = spaceRatePlans.find((plan) => plan.name === spacePlanContent.type) ?? {};

        const disabled = isSpacePlanCardDisabled(selectedPlatform, spacePlanContent.type);
        const content = formatSpacePlanContent(spacePlanContent, plan.price ?? 0);
        const showTooltip =
          spacePlanContent.type === SPACE_PURCHASE_TYPES.COMMUNITY &&
          !!selectedPlatform &&
          disabled;

        return (
          <ProductCard
            key={idx}
            cardType="space"
            loading={!spaceRatePlans}
            disabled={disabled}
            selected={selectedSpacePlan === plan.name}
            onClick={() => onSelect(plan.name)}
            content={content}
            showTooltip={showTooltip}
            testId="space-plan-card"
          />
        );
      })}

      {orgHasPaidSpaces && (
        <Card
          className={cx(styles.chooseLaterCard, { [styles.disabled]: !selectedPlatform })}
          padding="large"
          aria-disabled={!selectedPlatform}
          testId="choose-space-later-button"
          onClick={() => onSelect('')}>
          <Heading element="p">Choose space later</Heading>
        </Card>
      )}
    </>
  );
};
SpacePlanCards.propTypes = {
  spaceRatePlans: PropTypes.arrayOf(PropTypes.object),
  selectedPlatform: PropTypes.string,
  selectedSpacePlan: PropTypes.string,
  orgHasPaidSpaces: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
};

function isSpacePlanCardDisabled(selectedPlatform, spacePlanType) {
  if (!selectedPlatform) {
    return true;
  } else if (spacePlanType === SPACE_PURCHASE_TYPES.COMMUNITY) {
    return selectedPlatform === PLATFORM_TYPES.SPACE_COMPOSE_LAUNCH;
  }

  return false;
}

function formatSpacePlanContent(spacePlanContent, price) {
  return {
    title: spacePlanContent.title,
    description: spacePlanContent.description,
    price,
    limits: spacePlanContent.limits, // TODO: we need to use plan.inlcudedResources somehow
  };
}
