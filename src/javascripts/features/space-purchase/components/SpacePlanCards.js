import React from 'react';
import PropTypes from 'prop-types';

import { PlatformKind } from '../utils/platformContent';
import { SPACE_PLANS_CONTENT, SpacePlanKind } from '../utils/spacePurchaseContent';
import { ProductCard } from './ProductCard';

export const SpacePlanCards = ({
  disabled,
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
      {SPACE_PLANS_CONTENT.filter((content) => content.type !== SpacePlanKind.ENTERPRISE).map(
        (spacePlanContent, idx) => {
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
              loading={!spaceRatePlans || spaceRatePlans.length === 0}
              disabled={disabled || plan.currentPlan || !!tooltipText}
              selected={!!plan.name && plan.name === selectedSpacePlanName}
              current={plan.currentPlan}
              tooltipText={tooltipText}
              onClick={() => onSelect(plan)}
              content={content}
              testId="space-plan-card"
            />
          );
        }
      )}
    </>
  );
};

SpacePlanCards.propTypes = {
  disabled: PropTypes.bool,
  spaceRatePlans: PropTypes.arrayOf(PropTypes.object),
  selectedPlatform: PropTypes.object,
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
  // freeSpace is disabled when selectedPlatform is SPACE+COMPOSE and they don't have any paid spaces
  if (
    planType === SpacePlanKind.COMMUNITY &&
    selectedPlatform?.type === PlatformKind.WEB_APP_COMPOSE_LAUNCH &&
    !orgHasPaidSpaces
  ) {
    return 'Purchase a space to get Compose + Launch';
  }

  // freeSpace is disabled when user cannot make another freeSpace, needs to check false as it is undefined while loading.
  if (planType === SpacePlanKind.COMMUNITY && canCreateFreeSpace === false) {
    return 'You have already used your free space';
  }

  // paidSpaces are disabled when user can't create a paid space, needs to check false as it is undefined while loading.
  if (planType !== SpacePlanKind.COMMUNITY && canCreatePaidSpace === false) {
    return 'Please contact your organization owner and have them add billing information for your organization so you can purchase spaces';
  }

  return '';
}
