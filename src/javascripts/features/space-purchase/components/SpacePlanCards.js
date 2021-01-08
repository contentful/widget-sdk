import React from 'react';
import PropTypes from 'prop-types';

import { PLATFORM_TYPES } from 'features/space-purchase/utils/platformContent';
import {
  SPACE_PLANS_CONTENT,
  SPACE_PURCHASE_TYPES,
} from 'features/space-purchase/utils/spacePurchaseContent';
import { ProductCard } from './ProductCard';

export const SpacePlanCards = ({
  spaceRatePlans,
  selectedPlatform,
  selectedSpacePlanName,
  canCreateFreeSpace,
  canCreatePaidSpace,
  orgHasPaidSpaces,
  onSelect,
}) => {
  return (
    <>
      {SPACE_PLANS_CONTENT.filter(
        (content) => content.type !== SPACE_PURCHASE_TYPES.ENTERPRISE
      ).map((spacePlanContent, idx) => {
        const plan = spaceRatePlans.find((plan) => plan.name === spacePlanContent.type) ?? {};
        const content = formatSpacePlanContent(spacePlanContent, plan.price ?? 0);

        const tooltipText = getTooltipText(
          selectedPlatform,
          plan.name,
          orgHasPaidSpaces,
          canCreateFreeSpace,
          canCreatePaidSpace
        );

        return (
          <ProductCard
            key={idx}
            cardType="space"
            loading={!spaceRatePlans}
            disabled={!selectedPlatform || !!tooltipText}
            tooltipText={tooltipText}
            selected={!!plan.name && plan.name === selectedSpacePlanName}
            onClick={() => onSelect(plan)}
            content={content}
            testId="space-plan-card"
          />
        );
      })}
    </>
  );
};

SpacePlanCards.propTypes = {
  spaceRatePlans: PropTypes.arrayOf(PropTypes.object),
  selectedPlatform: PropTypes.string,
  selectedSpacePlanName: PropTypes.string,
  canCreateFreeSpace: PropTypes.bool,
  canCreatePaidSpace: PropTypes.bool,
  orgHasPaidSpaces: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
};

function formatSpacePlanContent(spacePlanContent, price) {
  return {
    title: spacePlanContent.title,
    description: spacePlanContent.description,
    price,
    limits: spacePlanContent.limits, // TODO: we need to use plan.inlcudedResources somehow
  };
}

function getTooltipText(
  selectedPlatform,
  planType,
  orgHasPaidSpaces,
  canCreateFreeSpace,
  canCreatePaidSpace
) {
  if (!selectedPlatform) {
    return '';
  }

  // freeSpace is disabled when selectedPlatform is SPACE+COMPOSE and they don't have any paid spaces
  if (
    planType === SPACE_PURCHASE_TYPES.COMMUNITY &&
    selectedPlatform === PLATFORM_TYPES.SPACE_COMPOSE_LAUNCH &&
    !orgHasPaidSpaces
  ) {
    return 'You must have a paid space to purchase Compose + Launch';
  }

  // freeSpace is disabled when user cannot make another freeSpace
  if (planType === SPACE_PURCHASE_TYPES.COMMUNITY && !canCreateFreeSpace) {
    return 'You have already used your free space';
  }

  // paidSpaces are disabled when user can't create a paid space
  if (planType !== SPACE_PURCHASE_TYPES.COMMUNITY && !canCreatePaidSpace) {
    return 'Please contact your organization owner and have them add billing information for your organization so you can purchase spaces';
  }

  return '';
}
